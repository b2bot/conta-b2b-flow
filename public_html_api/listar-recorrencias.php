<?php
// Arquivo listar-recorrencias.php - Lista todos os lançamentos recorrentes
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
    
    // Buscar todos os lançamentos recorrentes
    $stmt = $pdo->prepare("
        SELECT 
            r.id, r.tipo, r.valor, r.descricao, r.frequencia, r.proxima_data, r.criado_em,
            c.nome as categoria_nome, cc.nome as centro_custo_nome,
            r.categoria_id, r.centro_custo_id
        FROM recorrentes r
        LEFT JOIN categorias c ON r.categoria_id = c.id
        LEFT JOIN centro_custos cc ON r.centro_custo_id = cc.id
        ORDER BY r.proxima_data
    ");
    $stmt->execute();
    $recorrentes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retornar os lançamentos recorrentes
    echo json_encode([
        'status' => 'success',
        'recorrentes' => $recorrentes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar lançamentos recorrentes',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
