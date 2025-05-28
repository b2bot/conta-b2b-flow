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
    
    // Verificar se a receita existe
    $checkSql = "SELECT id FROM receitas_detalhadas WHERE id = :id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Receita não encontrada'
        ]);
        exit;
    }
    
    // Excluir a receita
    $sql = "DELETE FROM receitas_detalhadas WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':id', $data['id']);
    $stmt->execute();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Receita excluída com sucesso'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao excluir receita: ' . $e->getMessage()
    ]);
}
?>
