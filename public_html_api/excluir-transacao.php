<?php
// Arquivo excluir-transacao.php - Exclui uma transação pelo ID

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

    if (!$data || !is_array($data) || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'ID da transação não fornecido',
            'error_code' => 'MISSING_ID',
            'raw_input' => $input
        ]);
        exit;
    }

    $id = $data['id'];

    // Verificar se a transação existe
    $stmt = $pdo->prepare("SELECT id FROM transacoes WHERE id = :id");
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Transação não encontrada',
            'error_code' => 'TRANSACTION_NOT_FOUND'
        ]);
        exit;
    }

    // Excluir a transação
    $stmt = $pdo->prepare("DELETE FROM transacoes WHERE id = :id");
    $stmt->execute(['id' => $id]);

    // Verificar se a exclusão foi bem-sucedida
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Transação excluída com sucesso',
            'id' => $id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erro ao excluir transação',
            'error_code' => 'DELETE_FAILED'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao excluir transação: ' . $e->getMessage(),
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
