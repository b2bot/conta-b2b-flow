<?php
// Arquivo listar-contatos.php - Lista todos os contatos
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
    // Buscar todos os contatos
    $stmt = $pdo->prepare("SELECT id, nome, email, telefone, empresa, tipo, criado_em FROM contatos ORDER BY nome");
    $stmt->execute();
    $contatos = $stmt->fetchAll();

    // Retornar os contatos
    echo json_encode([
        'status' => 'success',
        'contatos' => $contatos
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar contatos',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
