<?php
// Arquivo login.php - Autenticação de usuários
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$email = isset($input['email']) ? trim($input['email']) : '';
$senha = isset($input['senha']) ? $input['senha'] : '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Email e senha são obrigatórios',
        'error_code' => 'MISSING_REQUIRED_FIELDS'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, nome, email, senha, funcao FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($senha, $user['senha'])) {
        $token = bin2hex(random_bytes(32));
        $stmt = $pdo->prepare("UPDATE usuarios SET token = :token WHERE id = :id");
        $stmt->execute([
            'token' => $token,
            'id' => $user['id']
        ]);

        echo json_encode([
            'status' => 'success',
            'id' => $user['id'],
            'nome_completo' => $user['nome'],
            'email' => $user['email'],
            'empresa' => '',
            'telefone' => '',
            'funcao' => $user['funcao'] ?? 'Usuário',
            'token' => $token
        ]);
        exit;
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email ou senha incorretos',
            'error_code' => 'INVALID_CREDENTIALS'
        ]);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao processar login',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}