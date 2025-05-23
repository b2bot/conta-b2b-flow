<?php
// Arquivo logout.php - Encerra a sessão do usuário
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

// Verificar se o token de autenticação está presente
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
    // Invalidar o token no banco de dados
    $stmt = $pdo->prepare("UPDATE usuarios SET token = NULL WHERE token = :token");
    $stmt->execute(['token' => $token]);
    
    // Verificar se algum registro foi afetado
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Logout realizado com sucesso'
        ]);
    } else {
        // Token não encontrado, mas não é um erro crítico
        echo json_encode([
            'status' => 'success',
            'message' => 'Sessão já encerrada ou token inválido'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao processar logout',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
