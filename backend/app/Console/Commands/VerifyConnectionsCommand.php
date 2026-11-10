<?php

namespace App\Console\Commands;

use App\Models\Conexao;
use App\Models\VerificacaoConexao;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class VerifyConnectionsCommand extends Command
{
    protected $signature = 'connections:verify {--id= : ID da conexão específica}';
    protected $description = 'Verifica conectividade e latência das conexões ativas cadastradas';

    public function handle(): int
    {
        $query = Conexao::query()->where('ativa', true);

        if ($id = $this->option('id')) {
            $query->where('id', (int) str_replace('c', '', $id));
        }

        $conexoes = $query->get();

        if ($conexoes->isEmpty()) {
            $this->info('Nenhuma conexão ativa encontrada para verificação.');
            return Command::SUCCESS;
        }

        $this->info("Verificando conectividade de {$conexoes->count()} conexão(ões)...");

        foreach ($conexoes as $connection) {
            $now = Carbon::now();
            $start = microtime(true);
            $status = 'online';
            $latency = 0;
            $msg = '';
            $decryptedPassword = '';

            try {
                if ($connection->senha_cifrada) {
                    try {
                        $decryptedPassword = Crypt::decryptString($connection->senha_cifrada);
                    } catch (\Throwable) {
                        $decryptedPassword = '';
                    }
                }

                $tipo = strtolower(str_replace(' ', '', $connection->tipo));

                if ($tipo === 'mysql' || $tipo === 'mariadb') {
                    $dsn = "mysql:host={$connection->host};port={$connection->porta};dbname={$connection->banco};charset=utf8mb4";
                    $options = [
                        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                        \PDO::ATTR_TIMEOUT => 4,
                    ];
                    $pdo = new \PDO($dsn, $connection->usuario_leitura, $decryptedPassword, $options);
                    $pdo->query('SELECT 1');
                } elseif ($tipo === 'postgresql') {
                    $dsn = "pgsql:host={$connection->host};port={$connection->porta};dbname={$connection->banco}";
                    $pdo = new \PDO($dsn, $connection->usuario_leitura, $decryptedPassword, [\PDO::ATTR_TIMEOUT => 4]);
                    $pdo->query('SELECT 1');
                } else {
                    $errno = 0;
                    $errstr = '';
                    $fp = @fsockopen($connection->host, (int) $connection->porta, $errno, $errstr, 4);
                    if (!$fp) {
                        throw new \Exception("Porta {$connection->porta} inacessível: {$errstr}");
                    }
                    fclose($fp);
                }

                $latency = (int) round((microtime(true) - $start) * 1000);
                $status = $latency > 1500 ? 'instavel' : 'online';
                $msg = "Conexão estabelecida com sucesso ({$latency} ms)";
            } catch (\Throwable $e) {
                $latency = (int) round((microtime(true) - $start) * 1000);
                $status = 'offline';
                $rawMsg = $e->getMessage();
                if ($decryptedPassword && strlen($decryptedPassword) > 3) {
                    $rawMsg = str_replace($decryptedPassword, '******', $rawMsg);
                }
                $msg = 'Falha ao conectar: ' . substr($rawMsg, 0, 180);
            }

            $connection->update([
                'status' => $status,
                'ultima_verificacao' => $now,
            ]);

            VerificacaoConexao::create([
                'conexao_id' => $connection->id,
                'status' => $status,
                'latencia_ms' => $status === 'offline' ? null : $latency,
                'mensagem' => $msg,
                'verificado_em' => $now,
            ]);

            $this->line(" [{$connection->id}] {$connection->nome} ({$connection->host}:{$connection->porta}) -> {$status} ({$msg})");
        }

        $this->info('Verificação concluída.');
        return Command::SUCCESS;
    }
}
