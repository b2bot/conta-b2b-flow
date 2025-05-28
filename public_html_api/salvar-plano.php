<?php
// Arquivo salvar-plano.php - Salva ou atualiza um plano
require_once 'headers.php';
require_once 'conexao.php';

// Recebe os dados do plano via POST
$input = json_decode(file_get_contents('php://input'), true);

// Verifica se os dados necessários foram enviados
if (!isset($input['nome']) || empty(trim($input['nome']))) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'O nome do plano é obrigatório'
    ]);
    exit;
}

try {
    // Prepara os dados para inserção/atualização
    $nome = trim($input['nome']);
    $descricao = isset($input['descricao']) ? trim($input['descricao']) : '';
    
    // Verifica se é uma atualização (tem ID) ou uma inserção (sem ID)
    if (isset($input['id']) && !empty($input['id'])) {
        // ATUALIZAÇÃO
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
        
        // Atualiza o plano existente
        $sql = "UPDATE planos SET nome = ?, descricao = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $descricao, $id]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Plano atualizado com sucesso',
            'id' => $id
        ]);
    } else {
        // INSERÇÃO
        // Verifica se já existe um plano com o mesmo nome
        $checkSql = "SELECT id FROM planos WHERE nome = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$nome]);
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode([
                'status' => 'error',
                'message' => 'Já existe um plano com este nome'
            ]);
            exit;
        }
        
        // Insere o novo plano
        $sql = "INSERT INTO planos (nome, descricao, criado_em) VALUES (?, ?, NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $descricao]);
        
        $id = $pdo->lastInsertId();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Plano criado com sucesso',
            'id' => $id
        ]);
    }
} catch (PDOException $e) {
    // Em produção, não exibir detalhes do erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao salvar plano',
        'error_code' => 'DB_QUERY_ERROR'
    ]);
    
    // Log do erro para depuração
    error_log('Erro em salvar-plano.php: ' . $e->getMessage());
}