<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'conexao.php'; // ajusta se o path for diferente

$input = json_decode(file_get_contents('php://input'), true);

$email = isset($input['email']) ? trim($input['email']) : '';
$senha = isset($input['senha']) ? $input['senha'] : '';

if (!$email || !$senha) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Preencha todos os campos obrigatórios.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, nome, email, senha, funcao FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($senha, $user['senha'])) {
        // Gera token aleatório (32 caracteres)
        $token = bin2hex(random_bytes(32));

        // Atualiza o token no banco para o usuário
        $stmt = $pdo->prepare("UPDATE usuarios SET token = :token WHERE id = :id");
        $stmt->execute([
            'token' => $token,
            'id' => $user['id']
        ]);

        // Retorna os dados do usuário E o token
        echo json_encode([
            'status' => 'success',
            'user' => [
                'id' => $user['id'],
                'nome' => $user['nome'],
                'email' => $user['email'],
                'funcao' => $user['funcao'] ?? 'Usuário'
            ],
            'token' => $token
        ]);
        exit;
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Email ou senha incorretos.'
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
?>