<?php
// Arquivo listar-transacoes.php - Lista todas as transações
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
    
    // Buscar todas as transações com informações completas
    $stmt = $pdo->prepare("
        SELECT 
            t.id, t.tipo, t.valor, t.descricao, t.data, t.criado_em,
            t.paid, t.recurrence, t.detalhes,
            c.id as categoria_id, c.nome as categoria_nome, 
            cc.id as centro_custo_id, cc.nome as centro_custo_nome,
            ct.id as contato_id, ct.nome as contato_nome
        FROM transacoes t
        LEFT JOIN categorias c ON t.categoria_id = c.id
        LEFT JOIN centro_custos cc ON t.centro_custo_id = cc.id
        LEFT JOIN contatos ct ON t.contato_id = ct.id
        ORDER BY t.data DESC
    ");
    $stmt->execute();
    $transacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Processar as transações para garantir campos consistentes
    foreach ($transacoes as &$transacao) {
        // Garantir que paid seja booleano
        $transacao['paid'] = (bool)($transacao['paid'] ?? false);
        
        // Definir status com base no tipo e paid
        if ($transacao['paid']) {
            $transacao['status'] = ($transacao['tipo'] === 'Despesa') ? 'Pago' : 'Recebido';
        } else {
            $transacao['status'] = ($transacao['tipo'] === 'Despesa') ? 'A pagar' : 'A receber';
        }
        
        // Garantir que recurrence tenha um valor padrão se for nulo
        if (!isset($transacao['recurrence']) || $transacao['recurrence'] === null) {
            $transacao['recurrence'] = 'none';
        }
        
        // Garantir que detalhes não seja nulo
        if (!isset($transacao['detalhes']) || $transacao['detalhes'] === null) {
            $transacao['detalhes'] = '';
        }
        
        // Garantir que contato_id e contato_nome não sejam nulos
        if (!isset($transacao['contato_id']) || $transacao['contato_id'] === null) {
            $transacao['contato_id'] = '';
        }
        if (!isset($transacao['contato_nome']) || $transacao['contato_nome'] === null) {
            $transacao['contato_nome'] = '';
        }
    }
    unset($transacao); // Remover referência

    // Retornar as transações
    echo json_encode([
        'status' => 'success',
        'transacoes' => $transacoes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao listar transações: ' . $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro inesperado: ' . $e->getMessage(),
        'error_code' => 'UNEXPECTED_ERROR'
    ]);
    exit;
}
