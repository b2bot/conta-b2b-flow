<?php
// Arquivo listar-centro-custos.php - Lista todos os centros de custo
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
    // Buscar todos os centros de custo
    $stmt = $pdo->prepare("SELECT id, nome, criado_em FROM centro_custos ORDER BY nome");
    $stmt->execute();
    $centros_custo = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retornar os centros de custo (NOME DO CAMPO AJUSTADO)
    echo json_encode([
        'status' => 'success',
        'centros_custo' => $centros_custo // <-- ESTE NOME TEM QUE BATER COM O FRONT
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar centros de custo',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}