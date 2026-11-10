-- ==============================================================================
-- Banco: hgm21923_dasboard_apacmcb
-- Compatível com MySQL 5.7+ / 8.0+
-- Collation: utf8mb4_unicode_ci
-- ==============================================================================

USE hgm21923_dasboard_apacmcb;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 1. Unidades
CREATE TABLE IF NOT EXISTS unidades (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(30) NOT NULL UNIQUE,
 nome VARCHAR(150) NOT NULL,
 descricao TEXT NULL,
 ativa BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Usuários
CREATE TABLE IF NOT EXISTS usuarios (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(150) NOT NULL,
 email VARCHAR(191) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL COMMENT 'Hash Argon2id/bcrypt gerado pelo Laravel; nunca senha em texto',
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 email_verified_at TIMESTAMP NULL,
 remember_token VARCHAR(100) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Perfis e Permissões
CREATE TABLE IF NOT EXISTS perfis (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(40) NOT NULL UNIQUE,
 nome VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissoes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(80) NOT NULL UNIQUE,
 descricao VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfil_permissao (
 perfil_id BIGINT UNSIGNED NOT NULL,
 permissao_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(perfil_id, permissao_id),
 FOREIGN KEY(perfil_id) REFERENCES perfis(id) ON DELETE CASCADE,
 FOREIGN KEY(permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vínculo Usuário - Unidade (um perfil por unidade)
CREATE TABLE IF NOT EXISTS usuario_unidade (
 usuario_id BIGINT UNSIGNED NOT NULL,
 unidade_id BIGINT UNSIGNED NOT NULL,
 perfil_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(usuario_id, unidade_id),
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 FOREIGN KEY(unidade_id) REFERENCES unidades(id),
 FOREIGN KEY(perfil_id) REFERENCES perfis(id),
 INDEX ix_vinculo_unidade(unidade_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Preferências de Usuário
CREATE TABLE IF NOT EXISTS preferencias_usuario (
 usuario_id BIGINT UNSIGNED PRIMARY KEY,
 alertar_conexoes BOOLEAN NOT NULL DEFAULT TRUE,
 destacar_vencidas BOOLEAN NOT NULL DEFAULT TRUE,
 abrir_todas_unidades BOOLEAN NOT NULL DEFAULT TRUE,
 resumo_semanal_email BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Conexões com os bancos das filiais (ERP de origem)
CREATE TABLE IF NOT EXISTS conexoes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 unidade_id BIGINT UNSIGNED NOT NULL,
 nome VARCHAR(150) NOT NULL,
 tipo ENUM('MySQL','MariaDB','PostgreSQL','SQL Server','Oracle') NOT NULL,
 host VARCHAR(255) NOT NULL,
 porta SMALLINT UNSIGNED NOT NULL,
 banco VARCHAR(150) NOT NULL,
 usuario_leitura VARCHAR(150) NOT NULL,
 senha_cifrada TEXT NOT NULL COMMENT 'Laravel Crypt; chave fora do banco e do código',
 descricao TEXT NULL,
 ativa BOOLEAN NOT NULL DEFAULT TRUE,
 status ENUM('nao_testada','online','instavel','offline') NOT NULL DEFAULT 'nao_testada',
 ultima_verificacao DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(unidade_id) REFERENCES unidades(id),
 UNIQUE KEY uq_conexao_nome(unidade_id, nome),
 UNIQUE KEY uq_conexao_unidade(id, unidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Histórico de verificações de conexão
CREATE TABLE IF NOT EXISTS verificacoes_conexao (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 conexao_id BIGINT UNSIGNED NOT NULL,
 status ENUM('online','instavel','offline') NOT NULL,
 latencia_ms INT UNSIGNED NULL,
 mensagem VARCHAR(500) NULL COMMENT 'Mensagem sanitizada; sem credenciais ou SQL',
 verificado_em DATETIME NOT NULL,
 FOREIGN KEY(conexao_id) REFERENCES conexoes(id),
 INDEX ix_verificacao(conexao_id, verificado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Histórico de sincronizações
CREATE TABLE IF NOT EXISTS sincronizacoes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 conexao_id BIGINT UNSIGNED NOT NULL,
 status ENUM('executando','concluida','falhou') NOT NULL DEFAULT 'executando',
 iniciada_em DATETIME NOT NULL,
 finalizada_em DATETIME NULL,
 registros_processados INT UNSIGNED NOT NULL DEFAULT 0,
 cursor_origem VARCHAR(255) NULL,
 erro_sanitizado VARCHAR(500) NULL,
 FOREIGN KEY(conexao_id) REFERENCES conexoes(id),
 INDEX ix_sincronizacao(conexao_id, iniciada_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Categorias
CREATE TABLE IF NOT EXISTS categorias (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 tipo ENUM('receita','despesa') NOT NULL,
 nome VARCHAR(150) NOT NULL,
 ativa BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uq_categoria(tipo, nome),
 UNIQUE KEY uq_categoria_tipo(id, tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Lançamentos centralizados (receitas e despesas)
CREATE TABLE IF NOT EXISTS lancamentos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 unidade_id BIGINT UNSIGNED NOT NULL,
 conexao_id BIGINT UNSIGNED NOT NULL,
 categoria_id BIGINT UNSIGNED NOT NULL,
 tipo ENUM('receita','despesa') NOT NULL,
 entidade_origem VARCHAR(100) NOT NULL COMMENT 'Identificador fixo do adaptador, não SQL',
 id_origem VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 codigo VARCHAR(60) NOT NULL,
 descricao VARCHAR(500) NOT NULL,
 data_lancamento DATE NOT NULL COMMENT 'Competência utilizada nas telas atuais',
 data_vencimento DATE NULL,
 data_liquidacao DATE NULL COMMENT 'Recebimento ou pagamento efetivo',
 valor DECIMAL(18,2) NOT NULL,
 cancelado BOOLEAN NOT NULL DEFAULT FALSE,
 sincronizado_em DATETIME NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(unidade_id) REFERENCES unidades(id),
 FOREIGN KEY(conexao_id, unidade_id) REFERENCES conexoes(id, unidade_id),
 FOREIGN KEY(categoria_id, tipo) REFERENCES categorias(id, tipo),
 UNIQUE KEY uq_origem(conexao_id, entidade_origem, tipo, id_origem),
 INDEX ix_competencia(unidade_id, data_lancamento, tipo),
 INDEX ix_liquidacao(unidade_id, data_liquidacao, tipo),
 INDEX ix_vencimento(unidade_id, cancelado, data_liquidacao, data_vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Saldos de abertura
CREATE TABLE IF NOT EXISTS saldos_abertura (
 unidade_id BIGINT UNSIGNED PRIMARY KEY,
 data_inicio DATE NOT NULL,
 valor DECIMAL(18,2) NOT NULL DEFAULT 0,
 observacao VARCHAR(500) NULL,
 FOREIGN KEY(unidade_id) REFERENCES unidades(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id BIGINT UNSIGNED NULL,
 unidade_id BIGINT UNSIGNED NULL,
 acao VARCHAR(80) NOT NULL,
 entidade VARCHAR(80) NOT NULL,
 entidade_id VARCHAR(191) NULL,
 contexto JSON NULL COMMENT 'Somente metadados sanitizados, nunca senhas/tokens',
 ocorrido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
 FOREIGN KEY(unidade_id) REFERENCES unidades(id),
 INDEX ix_auditoria_unidade(unidade_id, ocorrido_em),
 INDEX ix_auditoria_usuario(usuario_id, ocorrido_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- View: Receitas
CREATE OR REPLACE VIEW vw_receitas AS
SELECT l.*, c.nome AS categoria,
 CASE WHEN l.data_liquidacao IS NOT NULL THEN 'Recebida' ELSE 'Pendente' END AS status
FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
WHERE l.tipo='receita' AND l.cancelado=FALSE;

-- View: Despesas
CREATE OR REPLACE VIEW vw_despesas AS
SELECT l.*, c.nome AS categoria,
 CASE WHEN l.data_liquidacao IS NOT NULL THEN 'Paga'
 WHEN l.data_vencimento < CURRENT_DATE() THEN 'Vencida' ELSE 'Pendente' END AS status
FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
WHERE l.tipo='despesa' AND l.cancelado=FALSE;

-- View: Fluxo de Caixa (Compatível com MySQL 5.7 e 8.0)
CREATE OR REPLACE VIEW vw_fluxo_caixa AS
SELECT l.id, l.unidade_id, l.conexao_id, l.codigo, l.descricao, c.nome AS categoria,
 l.data_liquidacao AS data_movimento,
 CASE WHEN l.tipo='receita' THEN 'Entrada' ELSE 'Saída' END AS tipo,
 CASE WHEN l.tipo='receita' THEN l.valor ELSE 0 END AS entrada,
 CASE WHEN l.tipo='despesa' THEN l.valor ELSE 0 END AS saida
FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
WHERE l.data_liquidacao IS NOT NULL AND l.cancelado=FALSE;

-- View: Resumo por Competência
CREATE OR REPLACE VIEW vw_resumo_competencia AS
SELECT unidade_id, YEAR(data_lancamento) AS ano, MONTH(data_lancamento) AS mes,
 SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) AS receitas,
 SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) AS despesas,
 SUM(CASE WHEN tipo='receita' AND data_liquidacao IS NOT NULL THEN valor ELSE 0 END) AS recebido,
 SUM(CASE WHEN tipo='despesa' AND data_liquidacao IS NOT NULL THEN valor ELSE 0 END) AS pago,
 SUM(CASE WHEN data_liquidacao IS NULL THEN 0 WHEN tipo='receita' THEN valor ELSE -valor END) AS saldo_mensal
FROM lancamentos WHERE cancelado=FALSE
GROUP BY unidade_id,YEAR(data_lancamento),MONTH(data_lancamento);

-- View: Resumo por Caixa
CREATE OR REPLACE VIEW vw_resumo_caixa AS
SELECT unidade_id, YEAR(data_liquidacao) AS ano, MONTH(data_liquidacao) AS mes,
 SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) AS recebido,
 SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) AS pago,
 SUM(CASE WHEN tipo='receita' THEN valor ELSE -valor END) AS saldo_mensal
FROM lancamentos WHERE cancelado=FALSE AND data_liquidacao IS NOT NULL
GROUP BY unidade_id,YEAR(data_liquidacao),MONTH(data_liquidacao);

