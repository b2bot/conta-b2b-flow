<?php
require_once 'headers.php';
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

try {
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
    $recorrentes = $stmt->fetchAll(PDO::FETCH_ASSOC); // <--- CORREÇÃO

    echo json_encode([
        'status' => 'success',
        'recorrentes' => $recorrentes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar lançamentos recorrentes: ' . $e->getMessage(), // Log detalhado
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}