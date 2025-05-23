<?php
// Arquivo atualizar-banco.php - Script para atualizar a estrutura do banco de dados
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

// Verificar token de autenticação
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Token de autenticação não fornecido',
        'error_code' => 'AUTH_TOKEN_MISSING'
    ]);
    exit;
}

try {
    // Verificar se o token é válido
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token = :token");
    $stmt->execute(['token' => $token]);
    
    if (!$stmt->fetch()) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Token inválido ou expirado',
            'error_code' => 'INVALID_TOKEN'
        ]);
        exit;
    }
    
    // Verificar se as colunas existem na tabela transacoes
    $stmt = $pdo->prepare("SHOW COLUMNS FROM transacoes LIKE 'paid'");
    $stmt->execute();
    $paidExists = $stmt->fetch() ? true : false;
    
    $stmt = $pdo->prepare("SHOW COLUMNS FROM transacoes LIKE 'recurrence'");
    $stmt->execute();
    $recurrenceExists = $stmt->fetch() ? true : false;
    
    $stmt = $pdo->prepare("SHOW COLUMNS FROM transacoes LIKE 'detalhes'");
    $stmt->execute();
    $detalhesExists = $stmt->fetch() ? true : false;
    
    $stmt = $pdo->prepare("SHOW COLUMNS FROM transacoes LIKE 'contato_id'");
    $stmt->execute();
    $contatoIdExists = $stmt->fetch() ? true : false;
    
    // Adicionar colunas se não existirem
    $alteracoes = [];
    
    if (!$paidExists) {
        $pdo->exec("ALTER TABLE transacoes ADD COLUMN paid BOOLEAN DEFAULT FALSE");
        $alteracoes[] = "Coluna 'paid' adicionada";
    }
    
    if (!$recurrenceExists) {
        $pdo->exec("ALTER TABLE transacoes ADD COLUMN recurrence VARCHAR(20) DEFAULT 'none'");
        $alteracoes[] = "Coluna 'recurrence' adicionada";
    }
    
    if (!$detalhesExists) {
        $pdo->exec("ALTER TABLE transacoes ADD COLUMN detalhes TEXT");
        $alteracoes[] = "Coluna 'detalhes' adicionada";
    }
    
    if (!$contatoIdExists) {
        $pdo->exec("ALTER TABLE transacoes ADD COLUMN contato_id INT");
        $alteracoes[] = "Coluna 'contato_id' adicionada";
    }
    
    // Adicionar índices para melhorar performance
    try {
        $pdo->exec("ALTER TABLE transacoes ADD INDEX idx_categoria_id (categoria_id)");
        $alteracoes[] = "Índice 'idx_categoria_id' adicionado";
    } catch (PDOException $e) {
        // Índice já existe, ignorar
    }
    
    try {
        $pdo->exec("ALTER TABLE transacoes ADD INDEX idx_contato_id (contato_id)");
        $alteracoes[] = "Índice 'idx_contato_id' adicionado";
    } catch (PDOException $e) {
        // Índice já existe, ignorar
    }
    
    try {
        $pdo->exec("ALTER TABLE transacoes ADD INDEX idx_data (data)");
        $alteracoes[] = "Índice 'idx_data' adicionado";
    } catch (PDOException $e) {
        // Índice já existe, ignorar
    }
    
    // Retornar resultado
    echo json_encode([
        'status' => 'success',
        'message' => 'Estrutura do banco de dados atualizada com sucesso',
        'alteracoes' => $alteracoes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao atualizar banco de dados: ' . $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
