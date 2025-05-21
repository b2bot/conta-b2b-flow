<?php
// Arquivo headers.php - Configuração padrão de cabeçalhos para todas as APIs
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Se for uma requisição OPTIONS (preflight), encerra aqui com status 200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
