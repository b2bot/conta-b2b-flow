<?php
require_once 'headers.php';
require_once 'conexao.php';

header('Content-Type: application/json; charset=utf-8');

// Lê o corpo da requisição
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Verifica se os dados são válidos
if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Dados inválidos ou ausentes.'
    ]);
    exit;
}

try {
    $importadas = [];

    foreach ($data as $linha) {
        $dataReceita = date('Y-m-d', strtotime($linha['Data'] ?? ''));
        $codigo = $linha['Código Cliente'] ?? '';
        $cliente = $linha['Cliente'] ?? '';
        $servico = $linha['Serviço'] ?? '';
        $plano = $linha['Plano'] ?? '';
        $categoriaServico = $linha['Categoria de Serviço'] ?? '';
        $valor = floatval(str_replace(',', '.', $linha['Valor (R$)'] ?? 0));
        $tipo = $linha['Tipo'] ?? 'Receita';
        $modelo = $linha['Modelo de Cobrança'] ?? 'Único';
        $status = $linha['Status'] ?? 'A receber';
        $entregas = $linha['Entregas Principais'] ?? '';

        // Buscar contato_id
        $contatoStmt = $pdo->prepare("SELECT id FROM contatos WHERE nome = ?");
        $contatoStmt->execute([$cliente]);
        $contato = $contatoStmt->fetch(PDO::FETCH_ASSOC);
        $contato_id = $contato ? $contato['id'] : null;

        // Buscar categoria_id
        $categoriaStmt = $pdo->prepare("SELECT id FROM categorias WHERE nome = ?");
        $categoriaStmt->execute([$categoriaServico]);
        $categoria = $categoriaStmt->fetch(PDO::FETCH_ASSOC);
        $categoria_id = $categoria ? $categoria['id'] : null;

        $stmt = $pdo->prepare("
            INSERT INTO receitas_detalhadas (
                data, codigo, contato_id, servico, plano, categoria_id,
                valor, tipo, modeloCobranca, status, entregasPrincipais,
                criado_em, atualizado_em
            ) VALUES (
                :data, :codigo, :contato_id, :servico, :plano, :categoria_id,
                :valor, :tipo, :modelo, :status, :entregas, NOW(), NOW()
            )
        ");

        $stmt->execute([
            'data' => $dataReceita,
            'codigo' => $codigo,
            'contato_id' => $contato_id,
            'servico' => $servico,
            'plano' => $plano,
            'categoria_id' => $categoria_id,
            'valor' => $valor,
            'tipo' => $tipo,
            'modelo' => $modelo,
            'status' => $status,
            'entregas' => $entregas
        ]);

        $importadas[] = [
            'id' => $pdo->lastInsertId(),
            'servico' => $servico,
            'valor' => $valor
        ];
    }

    echo json_encode([
        'status' => 'success',
        'message' => count($importadas) . ' receitas importadas com sucesso.',
        'dados' => $importadas
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro ao importar: ' . $e->getMessage()
    ]);
}