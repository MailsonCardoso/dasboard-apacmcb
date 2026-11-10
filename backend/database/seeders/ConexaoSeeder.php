<?php

namespace Database\Seeders;

use App\Models\Conexao;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class ConexaoSeeder extends Seeder
{
    public function run(): void
    {
        $conexoes = [
            [
                'id' => 1,
                'unidade_id' => 1,
                'nome' => 'Banco Financeiro Matriz',
                'tipo' => 'MySQL',
                'host' => '192.168.1.100',
                'porta' => 3306,
                'banco' => 'financeiro_db',
                'usuario_leitura' => 'consulta_financeira',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'Base principal do ERP da matriz',
                'ativa' => true,
                'status' => 'online',
                'ultima_verificacao' => '2026-11-09 18:42:00',
            ],
            [
                'id' => 2,
                'unidade_id' => 1,
                'nome' => 'Contábil Matriz',
                'tipo' => 'PostgreSQL',
                'host' => '10.0.0.15',
                'porta' => 5432,
                'banco' => 'contabil',
                'usuario_leitura' => 'ro_contabil',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'Lançamentos contábeis consolidados',
                'ativa' => true,
                'status' => 'online',
                'ultima_verificacao' => '2026-11-09 18:40:00',
            ],
            [
                'id' => 3,
                'unidade_id' => 2,
                'nome' => 'Financeiro São Luís',
                'tipo' => 'MariaDB',
                'host' => 'slz-db.interno.local',
                'porta' => 3306,
                'banco' => 'fin_slz',
                'usuario_leitura' => 'leitura_slz',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'ERP regional São Luís',
                'ativa' => true,
                'status' => 'online',
                'ultima_verificacao' => '2026-11-09 18:35:00',
            ],
            [
                'id' => 4,
                'unidade_id' => 3,
                'nome' => 'Financeiro Imperatriz',
                'tipo' => 'SQL Server',
                'host' => '192.168.20.8',
                'porta' => 1433,
                'banco' => 'FinanceiroIMP',
                'usuario_leitura' => 'svc_readonly',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'Sistema legado Imperatriz',
                'ativa' => true,
                'status' => 'instavel',
                'ultima_verificacao' => '2026-11-09 17:58:00',
            ],
            [
                'id' => 5,
                'unidade_id' => 4,
                'nome' => 'Financeiro Caxias',
                'tipo' => 'MySQL',
                'host' => '192.168.30.12',
                'porta' => 3306,
                'banco' => 'caxias_fin',
                'usuario_leitura' => 'consulta',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'ERP filial Caxias',
                'ativa' => true,
                'status' => 'online',
                'ultima_verificacao' => '2026-11-09 18:30:00',
            ],
            [
                'id' => 6,
                'unidade_id' => 5,
                'nome' => 'Financeiro Balsas',
                'tipo' => 'Oracle',
                'host' => 'bal-ora.interno.local',
                'porta' => 1521,
                'banco' => 'BALFIN',
                'usuario_leitura' => 'RO_FIN',
                'senha_cifrada' => Crypt::encryptString('Secret123!'),
                'descricao' => 'Base Oracle filial Balsas',
                'ativa' => false,
                'status' => 'offline',
                'ultima_verificacao' => '2026-11-08 22:10:00',
            ],
        ];

        foreach ($conexoes as $c) {
            Conexao::updateOrCreate(['id' => $c['id']], $c);
        }
    }
}

