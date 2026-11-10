<?php

namespace App\Http\Controllers;

use App\Http\Resources\DbConnectionResource;
use App\Models\Conexao;
use App\Models\VerificacaoConexao;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Crypt;

class DbConnectionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Conexao::query();

        $rawUnitId = $request->query('unitId') ?? $request->query('unit_id');
        if ($rawUnitId && $rawUnitId !== 'all') {
            $unitId = (int) str_replace('u', '', (string) $rawUnitId);
            $query->where('unidade_id', $unitId);
        }

        return DbConnectionResource::collection($query->get());
    }

    public function show(string $id): DbConnectionResource
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);
        return new DbConnectionResource($connection);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:150',
            'unitId' => 'sometimes',
            'unidade_id' => 'sometimes',
            'tipo' => 'required|in:MySQL,MariaDB,PostgreSQL,SQL Server,Oracle',
            'host' => 'required|string|max:255',
            'port' => 'sometimes|integer',
            'porta' => 'sometimes|integer',
            'database' => 'sometimes|string|max:150',
            'banco' => 'sometimes|string|max:150',
            'user' => 'sometimes|string|max:150',
            'usuario_leitura' => 'sometimes|string|max:150',
            'password' => 'nullable|string',
            'descricao' => 'nullable|string',
            'ativa' => 'boolean',
            'status' => 'sometimes|in:nao_testada,online,offline,instavel',
        ]);

        $rawUnitId = $validated['unitId'] ?? $validated['unidade_id'] ?? 1;
        $unidadeId = (int) str_replace('u', '', (string) $rawUnitId);

        $connection = new Conexao();
        $connection->unidade_id = $unidadeId;
        $connection->nome = $validated['nome'];
        $connection->tipo = $validated['tipo'];
        $connection->host = $validated['host'];
        $connection->porta = $validated['porta'] ?? $validated['port'] ?? 3306;
        $connection->banco = $validated['banco'] ?? $validated['database'] ?? '';
        $connection->usuario_leitura = $validated['usuario_leitura'] ?? $validated['user'] ?? '';
        $connection->senha = $validated['password'] ?? 'default';
        $connection->descricao = $validated['descricao'] ?? '';
        $connection->ativa = $validated['ativa'] ?? true;
        $connection->status = $validated['status'] ?? 'online';
        $connection->ultima_verificacao = Carbon::now();
        $connection->save();

        return response()->json(new DbConnectionResource($connection), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);

        $validated = $request->validate([
            'nome' => 'sometimes|string|max:150',
            'unitId' => 'sometimes',
            'unidade_id' => 'sometimes',
            'tipo' => 'sometimes|in:MySQL,MariaDB,PostgreSQL,SQL Server,Oracle',
            'host' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer',
            'porta' => 'sometimes|integer',
            'database' => 'sometimes|string|max:150',
            'banco' => 'sometimes|string|max:150',
            'user' => 'sometimes|string|max:150',
            'usuario_leitura' => 'sometimes|string|max:150',
            'password' => 'nullable|string',
            'descricao' => 'nullable|string',
            'ativa' => 'boolean',
            'status' => 'sometimes|in:nao_testada,online,offline,instavel',
        ]);

        if (isset($validated['unitId']) || isset($validated['unidade_id'])) {
            $rawUnitId = $validated['unitId'] ?? $validated['unidade_id'];
            $connection->unidade_id = (int) str_replace('u', '', (string) $rawUnitId);
        }
        if (isset($validated['nome'])) $connection->nome = $validated['nome'];
        if (isset($validated['tipo'])) $connection->tipo = $validated['tipo'];
        if (isset($validated['host'])) $connection->host = $validated['host'];
        if (isset($validated['port']) || isset($validated['porta'])) {
            $connection->porta = $validated['porta'] ?? $validated['port'];
        }
        if (isset($validated['banco']) || isset($validated['database'])) {
            $connection->banco = $validated['banco'] ?? $validated['database'];
        }
        if (isset($validated['usuario_leitura']) || isset($validated['user'])) {
            $connection->usuario_leitura = $validated['usuario_leitura'] ?? $validated['user'];
        }
        if (!empty($validated['password'])) {
            $connection->senha = $validated['password'];
        }
        if (isset($validated['descricao'])) $connection->descricao = $validated['descricao'];
        if (isset($validated['status'])) $connection->status = $validated['status'];
        if (isset($validated['ativa'])) $connection->ativa = $validated['ativa'];

        $connection->save();

        return response()->json(new DbConnectionResource($connection));
    }

    public function destroy(string $id): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);
        $connection->update(['ativa' => false]);
        return response()->json(['message' => 'Configuração de conexão desativada com sucesso.']);
    }

    public function test(Request $request, string $id): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);
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
                // Teste de acessibilidade de socket de rede
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

        return response()->json([
            'ok' => $status !== 'offline',
            'status' => $status,
            'latency' => $latency,
            'message' => $msg,
            'lastCheck' => $now->toIso8601String(),
        ]);
    }

    public function syncAll(Request $request, \App\Services\UnitDatabaseSyncService $syncService): JsonResponse
    {
        $conexoes = Conexao::where('ativa', true)->get();
        if ($conexoes->isEmpty()) {
            return response()->json([
                'ok' => true,
                'total_connections' => 0,
                'processed' => 0,
                'message' => 'Nenhuma conexão ativa encontrada para sincronização.',
            ]);
        }

        $totalProcessed = 0;
        $successCount = 0;
        $errors = [];

        foreach ($conexoes as $conexao) {
            $res = $syncService->syncConnection($conexao);
            if ($res['ok']) {
                $successCount++;
                $totalProcessed += ($res['processed'] ?? 0);
            } else {
                $errors[] = "{$conexao->nome}: {$res['message']}";
            }
        }

        $allOk = empty($errors);
        $msg = $allOk
            ? "Sincronização concluída com sucesso: {$totalProcessed} movimentações importadas em {$successCount} conexão(ões)."
            : "Sincronização finalizada com avisos: " . implode('; ', $errors);

        return response()->json([
            'ok' => $allOk,
            'total_connections' => $conexoes->count(),
            'processed' => $totalProcessed,
            'message' => $msg,
        ], $allOk ? 200 : 207);
    }

    public function sync(Request $request, string $id, \App\Services\UnitDatabaseSyncService $syncService): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);

        $result = $syncService->syncConnection($connection);

        return response()->json($result, $result['ok'] ? 200 : 422);
    }
}
