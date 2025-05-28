<?php
// Arquivo excluir-plano.php - Exclui um plano existente
require_once 'headers.php';
require_once 'conexao.php';

// Recebe os dados via POST
$input = json_decode(file_get_contents('php://input'), true);

// Verifica se o ID foi enviado
if (!isset($input['id']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'ID do plano é obrigatório'
    ]);
    exit;
}

try {
    $id = $input['id'];
    
    // Verifica se o plano existe
    $checkSql = "SELECT id FROM planos WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$id]);
    
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Plano não encontrado'
        ]);
        exit;
    }
    
    // Verifica se a tabela receitas existe antes de verificar o uso
    $checkTableSql = "SHOW TABLES LIKE 'receitas'";
    $checkTableStmt = $pdo->prepare($checkTableSql);
    $checkTableStmt->execute();
    
    if ($checkTableStmt->rowCount() > 0) {
        // Verifica se a coluna plano_id existe na tabela receitas
        $checkColumnSql = "SHOW COLUMNS FROM receitas LIKE 'plano_id'";
        $checkColumnStmt = $pdo->prepare($checkColumnSql);
        $checkColumnStmt->execute();
        
        if ($checkColumnStmt->rowCount() > 0) {
            // Verifica se o plano está sendo usado em alguma receita
            $checkUsageSql = "SELECT id FROM receitas WHERE plano_id = ? LIMIT 1";
            $checkUsageStmt = $pdo->prepare($checkUsageSql);
            $checkUsageStmt->execute([$id]);
            
            if ($checkUsageStmt->rowCount() > 0) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Este plano está sendo usado em receitas e não pode ser excluído'
                ]);
                exit;
            }
        }
    }
    
    // Exclui o plano
    $sql = "DELETE FROM planos WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Plano excluído com sucesso'
    ]);
    
} catch (PDOException $e) {
    // Em produção, não exibir detalhes do erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao excluir plano: ' . $e->getMessage(),
        'error_code' => 'DB_QUERY_ERROR'
    ]);
    
    // Log do erro para depuração
    error_log('Erro em excluir-plano.php: ' . $e->getMessage());
}