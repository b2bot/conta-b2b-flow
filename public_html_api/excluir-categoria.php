<?php
// Arquivo excluir-categoria.php - Exclui uma categoria pelo ID

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
            'message' => 'ID da categoria não fornecido',
            'error_code' => 'MISSING_ID',
            'raw_input' => $input
        ]);
        exit;
    }

    $id = $data['id'];

    // Verificar se a categoria existe
    $stmt = $pdo->prepare("SELECT id FROM categorias WHERE id = :id");
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Categoria não encontrada',
            'error_code' => 'CATEGORY_NOT_FOUND'
        ]);
        exit;
    }

    // Verificar se a categoria está sendo usada em transações
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM transacoes WHERE categoria_id = :id");
    $stmt->execute(['id' => $id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['total'] > 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Esta categoria não pode ser excluída pois está sendo usada em transações',
            'error_code' => 'CATEGORY_IN_USE'
        ]);
        exit;
    }
    
    // Verificar se a categoria está sendo usada em recorrentes
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM recorrentes WHERE categoria_id = :id");
    $stmt->execute(['id' => $id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['total'] > 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Esta categoria não pode ser excluída pois está sendo usada em lançamentos recorrentes',
            'error_code' => 'CATEGORY_IN_USE'
        ]);
        exit;
    }

    // Excluir a categoria
    $stmt = $pdo->prepare("DELETE FROM categorias WHERE id = :id");
    $stmt->execute(['id' => $id]);

    // Verificar se a exclusão foi bem-sucedida
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Categoria excluída com sucesso',
            'id' => $id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erro ao excluir categoria',
            'error_code' => 'DELETE_FAILED'
        ]);
    }
} catch (PDOException $e) {
    // Verificar se é um erro de integridade referencial
    if ($e->getCode() == '23000') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Esta categoria não pode ser excluída pois está sendo usada em outras partes do sistema',
            'error_code' => 'CATEGORY_IN_USE'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erro ao excluir categoria: ' . $e->getMessage(),
            'error_code' => 'DB_ERROR'
        ]);
    }
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
