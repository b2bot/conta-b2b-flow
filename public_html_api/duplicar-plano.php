<?php
// Arquivo duplicar-plano.php - Duplica um plano existente
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
    $checkSql = "SELECT nome, descricao FROM planos WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$id]);
    
    $plano = $checkStmt->fetch();
    
    if (!$plano) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Plano não encontrado'
        ]);
        exit;
    }
    
    // Cria um novo nome para o plano duplicado
    $novoNome = $plano['nome'] . ' (Cópia)';
    
    // Verifica se já existe um plano com o novo nome
    $checkNomeSql = "SELECT id FROM planos WHERE nome = ?";
    $checkNomeStmt = $pdo->prepare($checkNomeSql);
    $checkNomeStmt->execute([$novoNome]);
    
    // Se já existir uma cópia, adiciona um número sequencial
    if ($checkNomeStmt->rowCount() > 0) {
        $contador = 1;
        do {
            $contador++;
            $novoNomeComContador = $plano['nome'] . ' (Cópia ' . $contador . ')';
            
            $checkNomeStmt->execute([$novoNomeComContador]);
            $existe = $checkNomeStmt->rowCount() > 0;
            
            if (!$existe) {
                $novoNome = $novoNomeComContador;
            }
        } while ($existe && $contador < 100); // Limite de 100 tentativas
    }
    
    // Insere o novo plano (duplicado)
    $sql = "INSERT INTO planos (nome, descricao, criado_em) VALUES (?, ?, NOW())";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$novoNome, $plano['descricao']]);
    
    $novoId = $pdo->lastInsertId();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Plano duplicado com sucesso',
        'id' => $novoId,
        'nome' => $novoNome
    ]);
    
} catch (PDOException $e) {
    // Em produção, não exibir detalhes do erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao duplicar plano',
        'error_code' => 'DB_QUERY_ERROR'
    ]);
    
    // Log do erro para depuração
    error_log('Erro em duplicar-plano.php: ' . $e->getMessage());
}