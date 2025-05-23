<?php
// Arquivo criar-categoria-receita.php - Cria uma categoria do tipo Receita para teste

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

    // Verificar se já existem categorias do tipo Receita
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM categorias WHERE tipo = 'Receita'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['total'] > 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Já existem categorias do tipo Receita',
            'total' => $result['total']
        ]);
        exit;
    }

    // Criar categorias do tipo Receita
    $categorias = [
        ['nome' => 'Vendas', 'tipo' => 'Receita'],
        ['nome' => 'Serviços', 'tipo' => 'Receita'],
        ['nome' => 'Investimentos', 'tipo' => 'Receita'],
        ['nome' => 'Reembolsos', 'tipo' => 'Receita']
    ];

    $stmt = $pdo->prepare("INSERT INTO categorias (nome, tipo, criado_em) VALUES (:nome, :tipo, NOW())");
    
    $inserted = 0;
    foreach ($categorias as $categoria) {
        $stmt->execute([
            'nome' => $categoria['nome'],
            'tipo' => $categoria['tipo']
        ]);
        $inserted++;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Categorias do tipo Receita criadas com sucesso',
        'inserted' => $inserted
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao criar categorias: ' . $e->getMessage(),
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
