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
            t.id, t.tipo, t.valor, t.descricao, t.data, t.criado_em,
            c.nome as categoria_nome, cc.nome as centro_custo_nome,
            t.categoria_id, t.centro_custo_id
        FROM transacoes t
        LEFT JOIN categorias c ON t.categoria_id = c.id
        LEFT JOIN centro_custos cc ON t.centro_custo_id = cc.id
        ORDER BY t.data DESC
    ");
    $stmt->execute();
    $transacoes = $stmt->fetchAll(PDO::FETCH_ASSOC); // <--- CORREÇÃO

    echo json_encode([
        'status' => 'success',
        'transacoes' => $transacoes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar transações: ' . $e->getMessage(), // Detalhe erro
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}