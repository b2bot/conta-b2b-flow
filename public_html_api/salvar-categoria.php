<?php
// Arquivo salvar-categoria.php - Salva ou atualiza uma categoria
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

    // Verificar se os dados necessários foram fornecidos
    if (!isset($data['nome']) || !isset($data['tipo'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Nome e tipo são obrigatórios',
            'error_code' => 'MISSING_REQUIRED_FIELDS'
        ]);
        exit;
    }

    // Verificar se é uma atualização ou inserção
    if (isset($data['id']) && $data['id'] > 0) {
        // Atualizar categoria existente
        $stmt = $pdo->prepare("UPDATE categorias SET nome = :nome, tipo = :tipo WHERE id = :id");
        $stmt->execute([
            'nome' => $data['nome'],
            'tipo' => $data['tipo'],
            'id' => $data['id']
        ]);
        
        $message = 'Categoria atualizada com sucesso';
        $id = $data['id'];
    } else {
        // Inserir nova categoria
        $stmt = $pdo->prepare("INSERT INTO categorias (nome, tipo, criado_em) VALUES (:nome, :tipo, NOW())");
        $stmt->execute([
            'nome' => $data['nome'],
            'tipo' => $data['tipo']
        ]);
        
        $id = $pdo->lastInsertId();
        $message = 'Categoria criada com sucesso';
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
        'message' => 'Erro ao salvar categoria',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
