<?php
// Arquivo listar-categorias.php - Lista todas as categorias
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

try {
    // Buscar todas as categorias
    $stmt = $pdo->prepare("SELECT id, nome, tipo, criado_em FROM categorias ORDER BY nome");
    $stmt->execute();
    $categorias = $stmt->fetchAll();

    // Retornar as categorias
    echo json_encode([
        'status' => 'success',
        'categorias' => $categorias
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar categorias',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
