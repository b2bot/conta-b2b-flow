-- Verificar se as colunas existem antes de adicioná-las
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT 'none';
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS detalhes TEXT;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS contato_id INT;

-- Adicionar índices para melhorar performance
ALTER TABLE transacoes ADD INDEX IF NOT EXISTS idx_categoria_id (categoria_id);
ALTER TABLE transacoes ADD INDEX IF NOT EXISTS idx_contato_id (contato_id);
ALTER TABLE transacoes ADD INDEX IF NOT EXISTS idx_data (data);
