<?php
// Arquivo conexao.php - Conexão com o banco de dados
// Configurações de conexão com o banco de dados
$host = 'localhost';
$db = 'base_sistema';
$user = 'base_sistema'; // Substituir pelo usuário real do banco
$pass = 'Vk@280112'; // Substituir pela senha real do banco
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Em caso de erro na conexão, retorna JSON com erro
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro de conexão com o banco de dados',
        'error_code' => 'DB_CONNECTION_ERROR'
    ]);
    exit;
}