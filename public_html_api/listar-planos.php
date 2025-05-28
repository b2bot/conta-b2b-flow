<?php
// Arquivo listar-planos.php - Lista todos os planos cadastrados
require_once 'headers.php';
require_once 'conexao.php';

try {
    // Consulta SQL para buscar todos os planos
    $sql = "SELECT id, nome, descricao, DATE_FORMAT(criado_em, '%Y-%m-%d %H:%i:%s') as criado_em 
            FROM planos 
            ORDER BY nome ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $planos = $stmt->fetchAll();
    
    // Retorna os planos em formato JSON
    echo json_encode([
        'status' => 'success',
        'planos' => $planos
    ]);
    
} catch (PDOException $e) {
    // Em produção, não exibir detalhes do erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao buscar planos',
        'error_code' => 'DB_QUERY_ERROR'
    ]);
    
    // Log do erro para depuração
    error_log('Erro em listar-planos.php: ' . $e->getMessage());
}