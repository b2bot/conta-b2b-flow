<?php
// Arquivo salvar-transacao.php - Salva ou atualiza uma transação

// --- DEBUG: REMOVA EM PRODUÇÃO ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// ---------------------------------

header('Content-Type: application/json; charset=utf-8');

try {
    require_once 'headers.php';
    require_once 'conexao.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao carregar dependências: ' . $e->getMessage(),
        'error_code' => 'INTERNAL_ERROR'
    ]);
    exit;
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

// Verificar token de autenticação
$headers = function_exists('getallheaders') ? getallheaders() : [];
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Token de autenticação não fornecido',
        'error_code' => 'AUTH_TOKEN_MISSING'
    ]);
    exit;
}

try {
    // Verificar se o token é válido
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token = :token");
    $stmt->execute(['token' => $token]);
    if (!$stmt->fetch()) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Token inválido ou expirado',
            'error_code' => 'INVALID_TOKEN'
        ]);
        exit;
    }

    // Obter dados do corpo da requisição
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data || !is_array($data)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Dados enviados são inválidos ou não são JSON',
            'error_code' => 'INVALID_JSON',
            'raw_input' => $input
        ]);
        exit;
    }

    // Verificar se os dados necessários foram fornecidos
    if (
        !isset($data['descricao']) ||
        !isset($data['valor']) ||
        !isset($data['tipo']) ||
        !isset($data['data'])
    ) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Descrição, valor, tipo e data são obrigatórios',
            'error_code' => 'MISSING_REQUIRED_FIELDS',
            'received_data' => $data
        ]);
        exit;
    }

    // Limpeza e preparação dos dados
    $descricao = trim($data['descricao']);
    $valor = floatval(str_replace(',', '.', $data['valor']));
    $tipo = trim($data['tipo']);
    $dataTransacao = trim($data['data']);
    $categoria_id = isset($data['categoria_id']) ? $data['categoria_id'] : null;
    $centro_custo_id = isset($data['centro_custo_id']) ? $data['centro_custo_id'] : null;

    // Verificar se é uma atualização ou inserção
    if (isset($data['id']) && intval($data['id']) > 0) {
        // Atualizar transação existente
        $stmt = $pdo->prepare("
            UPDATE transacoes SET 
                descricao = :descricao, 
                valor = :valor, 
                tipo = :tipo, 
                categoria_id = :categoria_id, 
                centro_custo_id = :centro_custo_id, 
                data = :data 
            WHERE id = :id
        ");
        $stmt->execute([
            'descricao' => $descricao,
            'valor' => $valor,
            'tipo' => $tipo,
            'categoria_id' => $categoria_id,
            'centro_custo_id' => $centro_custo_id,
            'data' => $dataTransacao,
            'id' => $data['id']
        ]);
        $message = 'Transação atualizada com sucesso';
        $id = $data['id'];
    } else {
        // Inserir nova transação
        $stmt = $pdo->prepare("
            INSERT INTO transacoes 
                (descricao, valor, tipo, categoria_id, centro_custo_id, data, criado_em) 
            VALUES 
                (:descricao, :valor, :tipo, :categoria_id, :centro_custo_id, :data, NOW())
        ");
        $stmt->execute([
            'descricao' => $descricao,
            'valor' => $valor,
            'tipo' => $tipo,
            'categoria_id' => $categoria_id,
            'centro_custo_id' => $centro_custo_id,
            'data' => $dataTransacao
        ]);
        $id = $pdo->lastInsertId();
        $message = 'Transação criada com sucesso';
    }

    // Retornar sucesso
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'id' => $id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao salvar transação: ' . $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro inesperado: ' . $e->getMessage(),
        'error_code' => 'UNEXPECTED_ERROR'
    ]);
    exit;
}