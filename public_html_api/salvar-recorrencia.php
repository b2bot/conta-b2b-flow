<?php
// Arquivo salvar-recorrencia.php - Salva ou atualiza um lançamento recorrente
require_once 'headers.php';
require_once 'conexao.php';

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
$headers = getallheaders();
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
    $data = json_decode(file_get_contents('php://input'), true);

    // Validação dos campos obrigatórios
    $requiredFields = ['descricao', 'valor', 'tipo', 'frequencia', 'proxima_data'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => "Campo obrigatório ausente: $field",
                'error_code' => 'MISSING_REQUIRED_FIELDS',
                'received_data' => $data // Para debug, remova em produção
            ]);
            exit;
        }
    }

    // Constrói parâmetros para query
    $params = [
        'descricao'       => $data['descricao'],
        'valor'           => $data['valor'],
        'tipo'            => $data['tipo'],
        'categoria_id'    => $data['categoria_id'] ?? null,
        'centro_custo_id' => $data['centro_custo_id'] ?? null,
        'frequencia'      => $data['frequencia'],
        'proxima_data'    => $data['proxima_data'],
    ];

    if (isset($data['id']) && $data['id'] > 0) {
        // Atualizar lançamento recorrente existente
        $params['id'] = $data['id'];
        $stmt = $pdo->prepare("
            UPDATE recorrentes SET 
                descricao = :descricao, 
                valor = :valor, 
                tipo = :tipo, 
                categoria_id = :categoria_id, 
                centro_custo_id = :centro_custo_id, 
                frequencia = :frequencia, 
                proxima_data = :proxima_data 
            WHERE id = :id
        ");
        $stmt->execute($params);
        $message = 'Lançamento recorrente atualizado com sucesso';
        $id = $data['id'];
    } else {
        // Inserir novo lançamento recorrente
        $stmt = $pdo->prepare("
            INSERT INTO recorrentes 
                (descricao, valor, tipo, categoria_id, centro_custo_id, frequencia, proxima_data, criado_em) 
            VALUES 
                (:descricao, :valor, :tipo, :categoria_id, :centro_custo_id, :frequencia, :proxima_data, NOW())
        ");
        $stmt->execute($params);
        $id = $pdo->lastInsertId();
        $message = 'Lançamento recorrente criado com sucesso';
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
        'message' => 'Erro ao salvar lançamento recorrente: ' . $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}