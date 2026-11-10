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
        $nome = $request->input('name') ?? $request->input('nome');
        $tipo = $request->input('type') ?? $request->input('tipo') ?? 'MySQL';
        $host = $request->input('host');
        $porta = $request->input('port') ?? $request->input('porta') ?? 3306;
        $banco = $request->input('database') ?? $request->input('banco');
        $usuario = $request->input('user') ?? $request->input('usuario_leitura') ?? $request->input('usuario');
        $senha = $request->input('password') ?? $request->input('senha');
        $descricao = $request->input('description') ?? $request->input('descricao') ?? '';
        $ativa = $request->input('active') ?? $request->input('ativa') ?? true;
        $status = $request->input('status') ?? 'online';
        $rawUnitId = $request->input('unitId') ?? $request->input('unidade_id') ?? 1;
        $unidadeId = (int) str_replace('u', '', (string) $rawUnitId);

        $request->merge([
            'nome' => $nome,
            'tipo' => $tipo,
            'host' => $host,
            'porta' => (int) $porta,
            'banco' => $banco,
            'usuario_leitura' => $usuario,
            'senha' => $senha,
            'descricao' => $descricao,
            'unidade_id' => $unidadeId,
        ]);

        $validated = $request->validate([
            'nome' => 'required|string|max:150',
            'tipo' => 'required|in:MySQL,MariaDB,PostgreSQL,SQL Server,Oracle',
            'host' => 'required|string|max:255',
            'porta' => 'required|integer',
            'banco' => 'required|string|max:150',
            'usuario_leitura' => 'required|string|max:150',
            'senha' => 'nullable|string',
            'descricao' => 'nullable|string',
            'unidade_id' => 'required|integer',
        ]);

        $unidade = \App\Models\Unidade::find($validated['unidade_id']) ?: \App\Models\Unidade::first();
        if (!$unidade) {
            $unidade = \App\Models\Unidade::create([
                'codigo' => 'MAT-001',
                'nome' => 'Matriz',
                'descricao' => 'Unidade Padrão',
                'ativa' => true,
            ]);
        }

        $connection = new Conexao();
        $connection->unidade_id = $unidade->id;
        $connection->nome = $validated['nome'];
        $connection->tipo = $validated['tipo'];
        $connection->host = $validated['host'];
        $connection->porta = (int) $validated['porta'];
        $connection->banco = $validated['banco'];
        $connection->usuario_leitura = $validated['usuario_leitura'];
        if (!empty($validated['senha'])) {
            $connection->senha_cifrada = Crypt::encryptString($validated['senha']);
        }
        $connection->descricao = $validated['descricao'] ?? '';
        $connection->ativa = filter_var($ativa, FILTER_VALIDATE_BOOLEAN);
        $connection->status = in_array($status, ['online', 'offline', 'instavel', 'nao_testada']) ? $status : 'online';
        $connection->ultima_verificacao = Carbon::now();
        $connection->save();

        return response()->json(new DbConnectionResource($connection), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);

        $nome = $request->input('name') ?? $request->input('nome');
        $tipo = $request->input('type') ?? $request->input('tipo');
        $host = $request->input('host');
        $porta = $request->input('port') ?? $request->input('porta');
        $banco = $request->input('database') ?? $request->input('banco');
        $usuario = $request->input('user') ?? $request->input('usuario_leitura') ?? $request->input('usuario');
        $senha = $request->input('password') ?? $request->input('senha');
        $descricao = $request->input('description') ?? $request->input('descricao');
        $ativa = $request->input('active') ?? $request->input('ativa');
        $status = $request->input('status');
        $rawUnitId = $request->input('unitId') ?? $request->input('unidade_id');

        if ($nome !== null) $connection->nome = $nome;
        if ($tipo !== null) $connection->tipo = $tipo;
        if ($host !== null) $connection->host = $host;
        if ($porta !== null) $connection->porta = (int) $porta;
        if ($banco !== null) $connection->banco = $banco;
        if ($usuario !== null) $connection->usuario_leitura = $usuario;
        if (!empty($senha)) {
            $connection->senha_cifrada = Crypt::encryptString($senha);
        }
        if ($descricao !== null) $connection->descricao = $descricao;
        if ($ativa !== null) $connection->ativa = filter_var($ativa, FILTER_VALIDATE_BOOLEAN);
        if ($status !== null) $connection->status = $status;
        if ($rawUnitId !== null) {
            $uId = (int) str_replace('u', '', (string) $rawUnitId);
            if (\App\Models\Unidade::where('id', $uId)->exists()) {
                $connection->unidade_id = $uId;
            }
        }

        $connection->save();

        return response()->json(new DbConnectionResource($connection));
    }

    public function destroy(string $id): JsonResponse
    {
        $id = (int) str_replace('c', '', $id);
        $connection = Conexao::findOrFail($id);

        try {
            \App\Models\Lancamento::where('conexao_id', $connection->id)->delete();
            VerificacaoConexao::where('conexao_id', $connection->id)->delete();
            \App\Models\Sincronizacao::where('conexao_id', $connection->id)->delete();
            $connection->delete();
            return response()->json(['message' => 'Configuração de conexão excluída com sucesso.']);
        } catch (\Throwable) {
            $connection->update(['ativa' => false]);
            return response()->json(['message' => 'Configuração de conexão desativada com sucesso.']);
        }
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
