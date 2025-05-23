
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
    
    // Buscar todas as transações com informações de contato e categoria
    $stmt = $pdo->prepare("
        SELECT 
            t.id, t.tipo, t.valor, t.descricao, t.data, t.criado_em,
            t.paid, t.recurrence, t.detalhes,
            c.nome as categoria_nome, c.id as categoria_id,
            cc.nome as centro_custo_nome, cc.id as centro_custo_id,
            con.nome as contato_nome, con.id as contato_id
        FROM transacoes t
        LEFT JOIN categorias c ON t.categoria_id = c.id
        LEFT JOIN centro_custos cc ON t.centro_custo_id = cc.id
        LEFT JOIN contatos con ON t.contato_id = con.id
        ORDER BY t.data DESC
    ");
    $stmt->execute();
    $transacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert boolean values properly
    foreach ($transacoes as &$transacao) {
        $transacao['paid'] = (bool)$transacao['paid'];
        $transacao['valor'] = (float)$transacao['valor'];
    }

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
}
