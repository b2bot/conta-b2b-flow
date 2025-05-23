<?php
// Arquivo salvar-centro-custo.php - Salva ou atualiza um centro de custo
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

    // Obter dados do corpo da requisição
    $data = json_decode(file_get_contents('php://input'), true);

    // Verificar se os dados necessários foram fornecidos
    if (!isset($data['nome'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Nome é obrigatório',
            'error_code' => 'MISSING_REQUIRED_FIELDS'
        ]);
        exit;
    }

    // Definir tipo padrão como 'Despesa' se não for fornecido
    $tipo = isset($data['tipo']) ? $data['tipo'] : 'Despesa';
    
    // Verificar se o tipo é válido
    if ($tipo !== 'Despesa' && $tipo !== 'Receita') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Tipo inválido. Deve ser "Despesa" ou "Receita"',
            'error_code' => 'INVALID_TYPE'
        ]);
        exit;
    }

    // Verificar se a coluna 'tipo' existe na tabela centro_custos
    $stmt = $pdo->prepare("SHOW COLUMNS FROM centro_custos LIKE 'tipo'");
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        // A coluna 'tipo' não existe, vamos adicioná-la
        $stmt = $pdo->prepare("ALTER TABLE centro_custos ADD COLUMN tipo ENUM('Despesa', 'Receita') NOT NULL DEFAULT 'Despesa'");
        $stmt->execute();
    }

    // Verificar se é uma atualização ou inserção
    if (isset($data['id']) && $data['id'] > 0) {
        // Atualizar centro de custo existente
        $stmt = $pdo->prepare("UPDATE centro_custos SET nome = :nome, tipo = :tipo WHERE id = :id");
        $stmt->execute([
            'nome' => $data['nome'],
            'tipo' => $tipo,
            'id' => $data['id']
        ]);
        
        $message = 'Centro de custo atualizado com sucesso';
        $id = $data['id'];
    } else {
        // Inserir novo centro de custo
        $stmt = $pdo->prepare("INSERT INTO centro_custos (nome, tipo, criado_em) VALUES (:nome, :tipo, NOW())");
        $stmt->execute([
            'nome' => $data['nome'],
            'tipo' => $tipo
        ]);
        
        $id = $pdo->lastInsertId();
        $message = 'Centro de custo criado com sucesso';
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
        'message' => 'Erro ao salvar centro de custo: ' . $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
    exit;
}
