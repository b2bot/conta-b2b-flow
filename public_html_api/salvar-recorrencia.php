<?php
// Arquivo salvar-recorrente.php - Salva ou atualiza um lançamento recorrente
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
if (!isset($data['descricao']) || !isset($data['valor']) || !isset($data['tipo']) || 
    !isset($data['frequencia']) || !isset($data['proxima_data'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Descrição, valor, tipo, frequência e próxima data são obrigatórios',
        'error_code' => 'MISSING_REQUIRED_FIELDS'
    ]);
    exit;
}

try {
    // Verificar se é uma atualização ou inserção
    if (isset($data['id']) && $data['id'] > 0) {
        // Atualizar lançamento recorrente existente
        $stmt = $pdo->prepare("
            UPDATE recorrentes SET 
                descricao = :descricao, 
                valor = :valor, 
                tipo = :tipo, 
                categoria_id = :categoria_id, 
                centro_custo_id = :centro_custo_id, 
                frequencia = :frequencia, 
                proxima_data = :proxima_data 
            WHERE id = :id
        ");
        
        $stmt->execute([
            'descricao' => $data['descricao'],
            'valor' => $data['valor'],
            'tipo' => $data['tipo'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'centro_custo_id' => $data['centro_custo_id'] ?? null,
            'frequencia' => $data['frequencia'],
            'proxima_data' => $data['proxima_data'],
            'id' => $data['id']
        ]);
        
        $message = 'Lançamento recorrente atualizado com sucesso';
        $id = $data['id'];
    } else {
        // Inserir novo lançamento recorrente
        $stmt = $pdo->prepare("
            INSERT INTO recorrentes 
                (descricao, valor, tipo, categoria_id, centro_custo_id, frequencia, proxima_data, criado_em) 
            VALUES 
                (:descricao, :valor, :tipo, :categoria_id, :centro_custo_id, :frequencia, :proxima_data, NOW())
        ");
        
        $stmt->execute([
            'descricao' => $data['descricao'],
            'valor' => $data['valor'],
            'tipo' => $data['tipo'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'centro_custo_id' => $data['centro_custo_id'] ?? null,
            'frequencia' => $data['frequencia'],
            'proxima_data' => $data['proxima_data']
        ]);
        
        $id = $pdo->lastInsertId();
        $message = 'Lançamento recorrente criado com sucesso';
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
        'message' => 'Erro ao salvar lançamento recorrente',
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
