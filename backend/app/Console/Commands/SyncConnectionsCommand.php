<?php

namespace App\Console\Commands;

use App\Models\Conexao;
use App\Services\UnitDatabaseSyncService;
use Illuminate\Console\Command;

class SyncConnectionsCommand extends Command
{
    protected $signature = 'connections:sync {--id= : ID da conexão específica a sincronizar}';
    protected $description = 'Sincroniza transações, mensalidades e contas das bases remotas para o FinanceControl';

    public function handle(UnitDatabaseSyncService $syncService): int
    {
        $query = Conexao::query()->where('ativa', true);

        if ($id = $this->option('id')) {
            $query->where('id', (int) str_replace('c', '', $id));
        }

        $conexoes = $query->get();

        if ($conexoes->isEmpty()) {
            $this->info('Nenhuma conexão ativa encontrada para sincronização.');
            return Command::SUCCESS;
        }

        $this->info("Iniciando sincronização de {$conexoes->count()} conexão(ões)...");

        foreach ($conexoes as $connection) {
            $this->line("-> Sincronizando [{$connection->id}] {$connection->nome} ({$connection->banco}@{$connection->host})...");
            $result = $syncService->syncConnection($connection);

            if ($result['ok']) {
                $this->info("   [OK] {$result['message']}");
            } else {
                $this->error("   [FALHA] {$result['message']}");
            }
        }

        $this->info('Sincronização finalizada.');
        return Command::SUCCESS;
    }
}
