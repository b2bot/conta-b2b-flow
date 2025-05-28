<?php
require_once 'conexao.php';
require_once 'headers.php';

// Verificar se o usuário está autenticado (desabilitado temporariamente)
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

/*
if (!$token) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Não autorizado']);
    exit;
}
*/

// Obter dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Verificar dados obrigatórios
if (!isset($data['codigo']) || !isset($data['servico']) || !isset($data['valor'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Dados obrigatórios não fornecidos'
    ]);
    exit;
}

try {
    $conn = $pdo;
    $data_formatada = isset($data['data']) ? date('Y-m-d', strtotime($data['data'])) : date('Y-m-d');

    // Verificar se é update ou insert
    if (isset($data['id']) && !empty($data['id'])) {
        $sql = "UPDATE receitas_detalhadas SET 
                data = :data,
                codigo = :codigo,
                contato_id = :contato_id,
                servico = :servico,
                plano = :plano,
                plano_id = :plano_id,
                categoria_id = :categoria_id,
                valor = :valor,
                tipo = :tipo,
                modeloCobranca = :modeloCobranca,
                status = :status,
                entregasPrincipais = :entregasPrincipais,
                atualizado_em = NOW()
                WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $data['id']);
    } else {
        $sql = "INSERT INTO receitas_detalhadas (
                data, codigo, contato_id, servico, plano, plano_id, 
                categoria_id, valor, tipo, modeloCobranca, status, 
                entregasPrincipais, criado_em, atualizado_em
                ) VALUES (
                :data, :codigo, :contato_id, :servico, :plano, :plano_id,
                :categoria_id, :valor, :tipo, :modeloCobranca, :status,
                :entregasPrincipais, NOW(), NOW()
                )";
        $stmt = $conn->prepare($sql);
    }

    $stmt->bindParam(':data', $data_formatada);
    $stmt->bindParam(':codigo', $data['codigo']);
    $stmt->bindParam(':contato_id', $data['contato_id']);
    $stmt->bindParam(':servico', $data['servico']);
    $stmt->bindParam(':plano', $data['plano']);
    $stmt->bindParam(':plano_id', $data['plano_id']);
    $stmt->bindParam(':categoria_id', $data['categoria_id']);

    $valor = str_replace(',', '.', $data['valor']);
    $stmt->bindParam(':valor', $valor);

    $stmt->bindParam(':tipo', $data['tipo']);
    $stmt->bindParam(':modeloCobranca', $data['modeloCobranca']);
    $stmt->bindParam(':status', $data['status']);
    $stmt->bindParam(':entregasPrincipais', $data['entregasPrincipais']);
    $stmt->execute();

    $id = isset($data['id']) && !empty($data['id']) ? $data['id'] : $conn->lastInsertId();
    $message = isset($data['id']) && !empty($data['id']) ? 'Receita atualizada com sucesso' : 'Receita criada com sucesso';

    // Replicar na tabela transacoes
    if (empty($data['id'])) {
        $inserirTransacao = $conn->prepare("
            INSERT INTO transacoes (
                tipo, categoria_id, valor, descricao, data, criado_em,
                paid, recurrence, detalhes, contato_id, receita_detalhada_id
            ) VALUES (
                :tipo, :categoria_id, :valor, :descricao, :data, NOW(),
                :paid, :recurrence, :detalhes, :contato_id, :receita_detalhada_id
            )
        ");
        $descricao = $data['servico'] ?? 'Receita Detalhada';
        $recurrence = ($data['modeloCobranca'] === 'Assinatura') ? 'monthly' : 'none';
        $paid = ($data['status'] === 'Recebido') ? 1 : 0;

        $inserirTransacao->bindParam(':tipo', $data['tipo']);
        $inserirTransacao->bindParam(':categoria_id', $data['categoria_id']);
        $inserirTransacao->bindParam(':valor', $valor);
        $inserirTransacao->bindParam(':descricao', $descricao);
        $inserirTransacao->bindParam(':data', $data_formatada);
        $inserirTransacao->bindParam(':paid', $paid);
        $inserirTransacao->bindParam(':recurrence', $recurrence);
        $inserirTransacao->bindParam(':detalhes', $data['entregasPrincipais']);
        $inserirTransacao->bindParam(':contato_id', $data['contato_id']);
        $inserirTransacao->bindParam(':receita_detalhada_id', $id);
        $inserirTransacao->execute();
    }

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'id' => $id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao salvar receita: ' . $e->getMessage()
    ]);
}