<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearMockDataCommand extends Command
{
    protected $signature = 'db:clear-mock-data {--all : Também remove unidades cadastradas}';
    protected $description = 'Limpa todas as transações, conexões e verificações mockadas do banco de dados';

    public function handle(): int
    {
        $this->info('Iniciando limpeza de dados mockados do banco...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $lancamentosCount = DB::table('lancamentos')->count();
        $verificacoesCount = DB::table('verificacoes_conexao')->count();
        $conexoesCount = DB::table('conexoes')->count();

        DB::table('lancamentos')->truncate();
        $this->line("- Tabela 'lancamentos' limpa ($lancamentosCount registros removidos).");

        DB::table('verificacoes_conexao')->truncate();
        $this->line("- Tabela 'verificacoes_conexao' limpa ($verificacoesCount registros removidos).");

        DB::table('conexoes')->truncate();
        $this->line("- Tabela 'conexoes' limpa ($conexoesCount registros removidos).");

        if (Schema::hasTable('saldos_abertura')) {
            $saldosCount = DB::table('saldos_abertura')->count();
            DB::table('saldos_abertura')->truncate();
            $this->line("- Tabela 'saldos_abertura' limpa ($saldosCount registros removidos).");
        }

        if ($this->option('all')) {
            $unidadesCount = DB::table('unidades')->count();
            DB::table('usuario_unidade')->truncate();
            DB::table('unidades')->truncate();
            $this->line("- Tabela 'unidades' limpa ($unidadesCount registros removidos).");
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->newLine();
        $this->info('Banco de dados limpo com sucesso!');
        $this->info('O banco agora está pronto para receber conexões e dados reais.');

        return Command::SUCCESS;
    }
}

