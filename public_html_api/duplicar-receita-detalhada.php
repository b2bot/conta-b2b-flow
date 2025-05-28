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

// Obter dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Verificar se o ID foi fornecido
if (!isset($data['id']) || empty($data['id'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'ID da receita não fornecido'
    ]);
    exit;
}

try {
    $conn = getConnection();
    
    // Buscar a receita a ser duplicada
    $selectSql = "SELECT * FROM receitas_detalhadas WHERE id = :id";
    $selectStmt = $conn->prepare($selectSql);
    $selectStmt->bindParam(':id', $data['id']);
    $selectStmt->execute();
    
    if ($selectStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Receita não encontrada'
        ]);
        exit;
    }
    
    // Obter os dados da receita
    $receita = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    // Inserir a nova receita (duplicada)
    $insertSql = "INSERT INTO receitas_detalhadas (
                data, codigo, contato_id, servico, plano, plano_id, 
                categoria_id, valor, tipo, modeloCobranca, status, 
                entregasPrincipais, criado_em, atualizado_em
                ) VALUES (
                :data, :codigo, :contato_id, :servico, :plano, :plano_id,
                :categoria_id, :valor, :tipo, :modeloCobranca, :status,
                :entregasPrincipais, NOW(), NOW()
                )";
                
    $insertStmt = $conn->prepare($insertSql);
    
    // Usar a data atual para a nova receita
    $data_atual = date('Y-m-d');
    
    // Bind dos parâmetros
    $insertStmt->bindParam(':data', $data_atual);
    $insertStmt->bindParam(':codigo', $receita['codigo']);
    $insertStmt->bindParam(':contato_id', $receita['contato_id']);
    $insertStmt->bindParam(':servico', $receita['servico']);
    $insertStmt->bindParam(':plano', $receita['plano']);
    $insertStmt->bindParam(':plano_id', $receita['plano_id']);
    $insertStmt->bindParam(':categoria_id', $receita['categoria_id']);
    $insertStmt->bindParam(':valor', $receita['valor']);
    $insertStmt->bindParam(':tipo', $receita['tipo']);
    $insertStmt->bindParam(':modeloCobranca', $receita['modeloCobranca']);
    
    // Definir status como "A receber" para a nova receita
    $status = 'A receber';
    $insertStmt->bindParam(':status', $status);
    
    $insertStmt->bindParam(':entregasPrincipais', $receita['entregasPrincipais']);
    
    $insertStmt->execute();
    
    // Obter o ID da nova receita
    $novoId = $conn->lastInsertId();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Receita duplicada com sucesso',
        'id' => $novoId
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao duplicar receita: ' . $e->getMessage()
    ]);
}
?>
