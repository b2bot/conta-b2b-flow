<?php
// Arquivo salvar-transacao.php - Salva ou atualiza uma transação
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

// Obter dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Verificar se os dados necessários foram fornecidos
if (!isset($data['descricao']) || !isset($data['valor']) || !isset($data['tipo']) || !isset($data['data'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Descrição, valor, tipo e data são obrigatórios',
        'error_code' => 'MISSING_REQUIRED_FIELDS'
    ]);
    exit;
}

try {
    // Verificar se é uma atualização ou inserção
    if (isset($data['id']) && $data['id'] > 0) {
        // Atualizar transação existente
        $stmt = $pdo->prepare("
            UPDATE transacoes SET 
                descricao = :descricao, 
                valor = :valor, 
                tipo = :tipo, 
                categoria_id = :categoria_id, 
                centro_custo_id = :centro_custo_id, 
                data = :data 
            WHERE id = :id
        ");
        
        $stmt->execute([
            'descricao' => $data['descricao'],
            'valor' => $data['valor'],
            'tipo' => $data['tipo'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'centro_custo_id' => $data['centro_custo_id'] ?? null,
            'data' => $data['data'],
            'id' => $data['id']
        ]);
        
        $message = 'Transação atualizada com sucesso';
        $id = $data['id'];
    } else {
        // Inserir nova transação
        $stmt = $pdo->prepare("
            INSERT INTO transacoes 
                (descricao, valor, tipo, categoria_id, centro_custo_id, data, criado_em) 
            VALUES 
                (:descricao, :valor, :tipo, :categoria_id, :centro_custo_id, :data, NOW())
        ");
        
        $stmt->execute([
            'descricao' => $data['descricao'],
            'valor' => $data['valor'],
            'tipo' => $data['tipo'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'centro_custo_id' => $data['centro_custo_id'] ?? null,
            'data' => $data['data']
        ]);
        
        $id = $pdo->lastInsertId();
        $message = 'Transação criada com sucesso';
    }

    // Retornar sucesso
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'id' => $id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao salvar transação',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
