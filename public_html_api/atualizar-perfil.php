<?php
// Arquivo atualizar-perfil.php - Atualiza dados do usuário
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

// Obter dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

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
    // Buscar usuário pelo token
    $stmt = $pdo->prepare("SELECT id, nome, email, senha FROM usuarios WHERE token = :token");
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

    // Preparar dados para atualização
    $updateData = [];
    $params = ['id' => $usuario['id']];

    // Atualizar nome se fornecido
    if (isset($data['name']) && !empty($data['name'])) {
        $updateData[] = "nome = :nome";
        $params['nome'] = $data['name'];
    }

    // Verificar se está tentando alterar a senha
    if (isset($data['currentPassword']) && isset($data['newPassword']) && 
        !empty($data['currentPassword']) && !empty($data['newPassword'])) {
        
        // Verificar se a senha atual está correta
        if (!password_verify($data['currentPassword'], $usuario['senha'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Senha atual incorreta',
                'error_code' => 'INVALID_CURRENT_PASSWORD'
            ]);
            exit;
        }

        // Adicionar nova senha aos dados de atualização
        $updateData[] = "senha = :senha";
        $params['senha'] = password_hash($data['newPassword'], PASSWORD_BCRYPT);
    }

    // Se não há dados para atualizar
    if (empty($updateData)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Nenhum dado foi alterado'
        ]);
        exit;
    }

    // Construir e executar a query de atualização
    $sql = "UPDATE usuarios SET " . implode(", ", $updateData) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Retornar sucesso
    echo json_encode([
        'status' => 'success',
        'message' => 'Dados atualizados com sucesso'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao atualizar dados do usuário',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
