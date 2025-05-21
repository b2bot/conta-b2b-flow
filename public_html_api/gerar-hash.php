<?php
// Arquivo gerar-hash.php - Gera hash para senhas
require_once 'headers.php';

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

// Obter dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Verificar se a senha foi fornecida
if (!isset($data['senha'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Senha é obrigatória',
        'error_code' => 'MISSING_REQUIRED_FIELDS'
    ]);
    exit;
}

// Gerar hash da senha
$hash = password_hash($data['senha'], PASSWORD_BCRYPT);

// Retornar o hash
echo json_encode([
    'status' => 'success',
    'hash' => $hash
]);
