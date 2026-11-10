<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE OR REPLACE VIEW vw_receitas AS
            SELECT l.*, c.nome AS categoria,
             CASE WHEN l.data_liquidacao IS NOT NULL THEN 'Recebida' ELSE 'Pendente' END AS status
            FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
            WHERE l.tipo='receita' AND l.cancelado=FALSE;
        ");

        DB::statement("
            CREATE OR REPLACE VIEW vw_despesas AS
            SELECT l.*, c.nome AS categoria,
             CASE WHEN l.data_liquidacao IS NOT NULL THEN 'Paga'
             WHEN l.data_vencimento < CURRENT_DATE() THEN 'Vencida' ELSE 'Pendente' END AS status
            FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
            WHERE l.tipo='despesa' AND l.cancelado=FALSE;
        ");

        DB::statement("
            CREATE OR REPLACE VIEW vw_fluxo_caixa AS
            SELECT l.id, l.unidade_id, l.conexao_id, l.codigo, l.descricao, c.nome AS categoria,
             l.data_liquidacao AS data_movimento,
             CASE WHEN l.tipo='receita' THEN 'Entrada' ELSE 'Saída' END AS tipo,
             CASE WHEN l.tipo='receita' THEN l.valor ELSE 0 END AS entrada,
             CASE WHEN l.tipo='despesa' THEN l.valor ELSE 0 END AS saida
            FROM lancamentos l JOIN categorias c ON c.id=l.categoria_id
            WHERE l.data_liquidacao IS NOT NULL AND l.cancelado=FALSE;
        ");

        DB::statement("
            CREATE OR REPLACE VIEW vw_resumo_competencia AS
            SELECT unidade_id, YEAR(data_lancamento) AS ano, MONTH(data_lancamento) AS mes,
             SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) AS receitas,
             SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) AS despesas,
             SUM(CASE WHEN tipo='receita' AND data_liquidacao IS NOT NULL THEN valor ELSE 0 END) AS recebido,
             SUM(CASE WHEN tipo='despesa' AND data_liquidacao IS NOT NULL THEN valor ELSE 0 END) AS pago,
             SUM(CASE WHEN data_liquidacao IS NULL THEN 0 WHEN tipo='receita' THEN valor ELSE -valor END) AS saldo_mensal
            FROM lancamentos WHERE cancelado=FALSE
            GROUP BY unidade_id,YEAR(data_lancamento),MONTH(data_lancamento);
        ");

        DB::statement("
            CREATE OR REPLACE VIEW vw_resumo_caixa AS
            SELECT unidade_id, YEAR(data_liquidacao) AS ano, MONTH(data_liquidacao) AS mes,
             SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) AS recebido,
             SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) AS pago,
             SUM(CASE WHEN tipo='receita' THEN valor ELSE -valor END) AS saldo_mensal
            FROM lancamentos WHERE cancelado=FALSE AND data_liquidacao IS NOT NULL
            GROUP BY unidade_id,YEAR(data_liquidacao),MONTH(data_liquidacao);
        ");
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS vw_resumo_caixa;");
        DB::statement("DROP VIEW IF EXISTS vw_resumo_competencia;");
        DB::statement("DROP VIEW IF EXISTS vw_fluxo_caixa;");
        DB::statement("DROP VIEW IF EXISTS vw_despesas;");
        DB::statement("DROP VIEW IF EXISTS vw_receitas;");
    }
};

