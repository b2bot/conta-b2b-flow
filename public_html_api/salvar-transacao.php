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
    $contato_id = isset($data['contato_id']) ? $data['contato_id'] : null;
    $paid = isset($data['paid']) ? (bool)$data['paid'] : false;
    $recurrence = isset($data['recurrence']) ? $data['recurrence'] : 'none';
    $detalhes = isset($data['detalhes']) ? $data['detalhes'] : '';

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
                contato_id = :contato_id,
                paid = :paid,
                recurrence = :recurrence,
                detalhes = :detalhes,
                data = :data 
            WHERE id = :id
        ");
        $stmt->execute([
            'descricao' => $descricao,
            'valor' => $valor,
            'tipo' => $tipo,
            'categoria_id' => $categoria_id,
            'centro_custo_id' => $centro_custo_id,
            'contato_id' => $contato_id,
            'paid' => $paid ? 1 : 0,
            'recurrence' => $recurrence,
            'detalhes' => $detalhes,
            'data' => $dataTransacao,
            'id' => $data['id']
        ]);
        $message = 'Transação atualizada com sucesso';
        $id = $data['id'];
    } else {
        // Inserir nova transação
        $stmt = $pdo->prepare("
            INSERT INTO transacoes 
                (descricao, valor, tipo, categoria_id, centro_custo_id, contato_id, paid, recurrence, detalhes, data, criado_em) 
            VALUES 
                (:descricao, :valor, :tipo, :categoria_id, :centro_custo_id, :contato_id, :paid, :recurrence, :detalhes, :data, NOW())
        ");
        $stmt->execute([
            'descricao' => $descricao,
            'valor' => $valor,
            'tipo' => $tipo,
            'categoria_id' => $categoria_id,
            'centro_custo_id' => $centro_custo_id,
            'contato_id' => $contato_id,
            'paid' => $paid ? 1 : 0,
            'recurrence' => $recurrence,
            'detalhes' => $detalhes,
            'data' => $dataTransacao
        ]);
        $id = $pdo->lastInsertId();
        $message = 'Transação criada com sucesso';
    }

    // Buscar a transação atualizada para retornar ao frontend
    $stmt = $pdo->prepare("
        SELECT 
            t.id, t.tipo, t.valor, t.descricao, t.data, t.criado_em,
            t.paid, t.recurrence, t.detalhes,
            c.id as categoria_id, c.nome as categoria_nome, 
            cc.id as centro_custo_id, cc.nome as centro_custo_nome,
            ct.id as contato_id, ct.nome as contato_nome
        FROM transacoes t
        LEFT JOIN categorias c ON t.categoria_id = c.id
        LEFT JOIN centro_custos cc ON t.centro_custo_id = cc.id
        LEFT JOIN contatos ct ON t.contato_id = ct.id
        WHERE t.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $transacao = $stmt->fetch(PDO::FETCH_ASSOC);

    // Processar a transação para garantir campos consistentes
    if ($transacao) {
        // Garantir que paid seja booleano
        $transacao['paid'] = (bool)($transacao['paid'] ?? false);
        
        // Definir status com base no tipo e paid
        if ($transacao['paid']) {
            $transacao['status'] = ($transacao['tipo'] === 'Despesa') ? 'Pago' : 'Recebido';
        } else {
            $transacao['status'] = ($transacao['tipo'] === 'Despesa') ? 'A pagar' : 'A receber';
        }
        
        // Garantir que recurrence tenha um valor padrão se for nulo
        if (!isset($transacao['recurrence']) || $transacao['recurrence'] === null) {
            $transacao['recurrence'] = 'none';
        }
        
        // Garantir que detalhes não seja nulo
        if (!isset($transacao['detalhes']) || $transacao['detalhes'] === null) {
            $transacao['detalhes'] = '';
        }
        
        // Garantir que contato_id e contato_nome não sejam nulos
        if (!isset($transacao['contato_id']) || $transacao['contato_id'] === null) {
            $transacao['contato_id'] = '';
        }
        if (!isset($transacao['contato_nome']) || $transacao['contato_nome'] === null) {
            $transacao['contato_nome'] = '';
        }
    }

    // Retornar sucesso
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'id' => $id,
        'transacao' => $transacao
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