<?php
// Arquivo dados-usuario.php - Retorna dados do usuário autenticado
require_once 'headers.php';
require_once 'conexao.php';

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
    // Buscar usuário pelo token (simplificado, em produção usar JWT)
    $stmt = $pdo->prepare("SELECT id, nome, email, funcao FROM usuarios WHERE token = :token");
    $stmt->execute(['token' => $token]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Token inválido ou expirado',
            'error_code' => 'INVALID_TOKEN'
        ]);
        exit;
    }

    // Retorna os dados do usuário
    echo json_encode([
        'status' => 'success',
        'user' => [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $usuario['email'],
            'funcao' => $usuario['funcao'] ?? 'Usuário'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao buscar dados do usuário',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
