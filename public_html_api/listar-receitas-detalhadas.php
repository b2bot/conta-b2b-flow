<?php
require_once 'conexao.php';
require_once 'headers.php';

// Verificar se o usuário está autenticado
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// Permitir acesso sem token durante desenvolvimento
// Em produção, descomentar o bloco abaixo
/*
if (!$token) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Não autorizado']);
    exit;
}
*/

try {
    // Verificar se a tabela existe
    $checkTableSql = "SHOW TABLES LIKE 'receitas_detalhadas'";
    $checkTableStmt = $pdo->prepare($checkTableSql);
    $checkTableStmt->execute();
    
    if ($checkTableStmt->rowCount() === 0) {
        // Tabela não existe, criar resposta vazia
        echo json_encode([
            'status' => 'success',
            'receitas' => []
        ]);
        exit;
    }

    // Consulta para buscar todas as receitas detalhadas
    $sql = "SELECT r.*, c.nome as cliente, cat.nome as categoriaServico 
            FROM receitas_detalhadas r 
            LEFT JOIN contatos c ON r.contato_id = c.id 
            LEFT JOIN categorias cat ON r.categoria_id = cat.id 
            ORDER BY r.data DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $receitas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retornar os resultados
    echo json_encode([
        'status' => 'success',
        'receitas' => $receitas
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar receitas: ' . $e->getMessage()
    ]);
}
?>