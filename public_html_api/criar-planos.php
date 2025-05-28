<?php
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

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
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token = :token");
    $stmt->execute(['token' => $token]);

    if (!$stmt->fetch()) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Token inválido', 'error_code' => 'INVALID_TOKEN']);
        exit;
    }

    $planos = [
        ['nome' => 'Cloud Hosting', 'descricao' => 'Plano de hospedagem na nuvem'],
        ['nome' => 'Web Essencial', 'descricao' => 'Plano web básico'],
        ['nome' => 'E-com Essencia', 'descricao' => 'Plano para e-commerce'],
        ['nome' => 'Premium', 'descricao' => 'Plano premium com recursos avançados']
    ];

    $stmt = $pdo->prepare("INSERT INTO planos (nome, descricao, criado_em) VALUES (:nome, :descricao, NOW())");

    $inseridos = 0;
    foreach ($planos as $p) {
        $stmt->execute(['nome' => $p['nome'], 'descricao' => $p['descricao']]);
        $inseridos++;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Planos criados com sucesso',
        'inserted' => $inseridos
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'error_code' => 'DB_ERROR']);
}