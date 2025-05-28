<?php
require_once 'headers.php';
require_once 'conexao.php';

// Aceita GET e POST (para compatibilidade com frontend)
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

// Verificar token (desativado em desenvolvimento)
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// Descomente abaixo em produção:
/*
if (!$token) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Token de autenticação não fornecido',
        'error_code' => 'AUTH_TOKEN_MISSING'
    ]);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE token = :token");
$stmt->execute(['token' => $token]);
if (!$stmt->fetch()) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Token de autenticação inválido ou expirado',
        'error_code' => 'AUTH_TOKEN_INVALID'
    ]);
    exit;
}
*/

try {
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

    foreach ($transacoes as &$transacao) {
        $transacao['paid'] = (bool)($transacao['paid'] ?? false);

        $transacao['status'] = $transacao['paid']
            ? ($transacao['tipo'] === 'Despesa' ? 'Pago' : 'Recebido')
            : ($transacao['tipo'] === 'Despesa' ? 'A pagar' : 'A receber');

        $transacao['recurrence'] = $transacao['recurrence'] ?? 'none';
        $transacao['detalhes'] = $transacao['detalhes'] ?? '';
        $transacao['contato_id'] = $transacao['contato_id'] ?? '';
        $transacao['contato_nome'] = $transacao['contato_nome'] ?? '';
    }
    unset($transacao);

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
?>