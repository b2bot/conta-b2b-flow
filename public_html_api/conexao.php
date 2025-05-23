<?php
// Arquivo conexao.php - Conexão com o banco de dados
try {
    $host = 'localhost';
    $dbname = 'base_sistema';
    $username = 'base_sistema'; // Substitua pelo seu usuário do banco
    $password = 'Vk@280112'; // Substitua pela sua senha do banco
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    // Em produção, não exibir detalhes do erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro de conexão com o banco de dados',
        'error_code' => 'DB_CONNECTION_ERROR'
    ]);
    exit;
}