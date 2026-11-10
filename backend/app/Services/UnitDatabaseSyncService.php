<?php

namespace App\Services;

use App\Models\Categoria;
use App\Models\Conexao;
use App\Models\Lancamento;
use App\Models\Sincronizacao;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use PDO;

class UnitDatabaseSyncService
{
    /**
     * Sincroniza os dados de uma conexão remota para as tabelas consolidadas do FinanceControl.
     * Segue estritamente as regras de negócio:
     * - 'transactions' é o caixa consolidado (entradas e saídas efetivadas).
     * - 'mensalidades' e 'revenues' pendentes alimentam o a receber.
     * - 'expenses' pendentes/atrasadas alimentam o a pagar.
     */
    public function syncConnection(Conexao $conexao): array
    {
        $sync = Sincronizacao::create([
            'conexao_id' => $conexao->id,
            'status' => 'executando',
            'iniciada_em' => Carbon::now(),
        ]);

        $decryptedPassword = '';
        if ($conexao->senha_cifrada) {
            try {
                $decryptedPassword = Crypt::decryptString($conexao->senha_cifrada);
            } catch (\Throwable) {
                $decryptedPassword = '';
            }
        }

        $processed = 0;

        try {
            $dsn = "mysql:host={$conexao->host};port={$conexao->porta};dbname={$conexao->banco};charset=utf8mb4";
            $pdo = new PDO($dsn, $conexao->usuario_leitura, $decryptedPassword, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 8,
            ]);

            // 1. Mapeamento de categorias financeiras do banco remoto
            $catMap = [];
            try {
                $catRows = $pdo->query("SELECT id, nome, tipo FROM financial_categories")->fetchAll();
                foreach ($catRows as $cr) {
                    $catMap[$cr['id']] = [
                        'nome' => $cr['nome'],
                        'tipo' => $cr['tipo'] === 'despesa' ? 'despesa' : 'receita',
                    ];
                }
            } catch (\Throwable) {
                // Tabela pode não existir ou estar vazia
            }

            // 2. Sincronização de transactions (Caixa Consolidado / Efetivado)
            $transRows = $pdo->query("SELECT * FROM transactions ORDER BY date ASC, id ASC")->fetchAll();

            foreach ($transRows as $t) {
                $tipo = ($t['type'] === 'saida') ? 'despesa' : 'receita';
                $nomeCat = !empty($t['category_name']) ? trim($t['category_name']) : ($tipo === 'receita' ? 'Receitas Diversas' : 'Outras Despesas');

                $categoria = Categoria::firstOrCreate(
                    ['nome' => $nomeCat, 'tipo' => $tipo],
                    ['ativa' => true]
                );

                Lancamento::updateOrCreate(
                    [
                        'conexao_id' => $conexao->id,
                        'entidade_origem' => 'transactions',
                        'tipo' => $tipo,
                        'id_origem' => (string) $t['id'],
                    ],
                    [
                        'unidade_id' => $conexao->unidade_id,
                        'categoria_id' => $categoria->id,
                        'codigo' => 'TRX-' . $t['id'],
                        'descricao' => $t['description'],
                        'data_lancamento' => $t['date'],
                        'data_liquidacao' => $t['date'],
                        'data_vencimento' => $t['date'],
                        'valor' => (float) $t['amount'],
                        'cancelado' => false,
                        'sincronizado_em' => Carbon::now(),
                    ]
                );
                $processed++;
            }

            // 3. Sincronização de mensalidades PENDENTES ou ATRASADAS (A Receber)
            // (As mensalidades pagas já foram sincronizadas via 'transactions')
            try {
                $mensRows = $pdo->query("SELECT * FROM mensalidades WHERE status IN ('pendente', 'atrasado')")->fetchAll();

                $catMensalidade = Categoria::firstOrCreate(
                    ['nome' => 'Mensalidades', 'tipo' => 'receita'],
                    ['ativa' => true]
                );

                $activePendingMensalidadeIds = [];

                foreach ($mensRows as $m) {
                    $activePendingMensalidadeIds[] = (string) $m['id'];
                    $valor = (float) (!empty($m['valor_cobrado']) ? $m['valor_cobrado'] : $m['valor']);

                    Lancamento::updateOrCreate(
                        [
                            'conexao_id' => $conexao->id,
                            'entidade_origem' => 'mensalidades',
                            'tipo' => 'receita',
                            'id_origem' => (string) $m['id'],
                        ],
                        [
                            'unidade_id' => $conexao->unidade_id,
                            'categoria_id' => $catMensalidade->id,
                            'codigo' => 'MEN-' . $m['id'],
                            'descricao' => "Mensalidade aluno #{$m['aluno_id']} - ref {$m['mes_referencia']}",
                            'data_lancamento' => $m['data_vencimento'],
                            'data_vencimento' => $m['data_vencimento'],
                            'data_liquidacao' => null, // Pendente / A receber
                            'valor' => $valor,
                            'cancelado' => false,
                            'sincronizado_em' => Carbon::now(),
                        ]
                    );
                    $processed++;
                }

                // Remove mensalidades pendentes anteriores que foram quitadas na origem
                Lancamento::where('conexao_id', $conexao->id)
                    ->where('entidade_origem', 'mensalidades')
                    ->where('tipo', 'receita')
                    ->whereNotIn('id_origem', $activePendingMensalidadeIds)
                    ->delete();
            } catch (\Throwable) {
                // Tabela mensalidades pode não existir em outros bancos
            }

            // 4. Sincronização de revenues PENDENTES (A Receber)
            try {
                $revRows = $pdo->query("SELECT * FROM revenues WHERE status = 'pendente'")->fetchAll();

                $activePendingRevIds = [];

                foreach ($revRows as $r) {
                    $activePendingRevIds[] = (string) $r['id'];
                    $catInfo = $catMap[$r['financial_category_id'] ?? 0] ?? null;
                    $nomeCat = $catInfo['nome'] ?? 'Outras Receitas';

                    $categoria = Categoria::firstOrCreate(
                        ['nome' => $nomeCat, 'tipo' => 'receita'],
                        ['ativa' => true]
                    );

                    Lancamento::updateOrCreate(
                        [
                            'conexao_id' => $conexao->id,
                            'entidade_origem' => 'revenues',
                            'tipo' => 'receita',
                            'id_origem' => (string) $r['id'],
                        ],
                        [
                            'unidade_id' => $conexao->unidade_id,
                            'categoria_id' => $categoria->id,
                            'codigo' => 'REV-' . $r['id'],
                            'descricao' => $r['descricao'],
                            'data_lancamento' => $r['data'],
                            'data_vencimento' => $r['data'],
                            'data_liquidacao' => null,
                            'valor' => (float) $r['valor'],
                            'cancelado' => false,
                            'sincronizado_em' => Carbon::now(),
                        ]
                    );
                    $processed++;
                }

                Lancamento::where('conexao_id', $conexao->id)
                    ->where('entidade_origem', 'revenues')
                    ->where('tipo', 'receita')
                    ->whereNotIn('id_origem', $activePendingRevIds)
                    ->delete();
            } catch (\Throwable) {
            }

            // 5. Sincronização de expenses PENDENTES ou ATRASADAS (A Pagar)
            try {
                $expRows = $pdo->query("SELECT * FROM expenses WHERE status IN ('pendente', 'atrasado')")->fetchAll();

                $activePendingExpIds = [];

                foreach ($expRows as $e) {
                    $activePendingExpIds[] = (string) $e['id'];
                    $catInfo = $catMap[$e['financial_category_id'] ?? 0] ?? null;
                    $nomeCat = $catInfo['nome'] ?? 'Outras Despesas';

                    $categoria = Categoria::firstOrCreate(
                        ['nome' => $nomeCat, 'tipo' => 'despesa'],
                        ['ativa' => true]
                    );

                    Lancamento::updateOrCreate(
                        [
                            'conexao_id' => $conexao->id,
                            'entidade_origem' => 'expenses',
                            'tipo' => 'despesa',
                            'id_origem' => (string) $e['id'],
                        ],
                        [
                            'unidade_id' => $conexao->unidade_id,
                            'categoria_id' => $categoria->id,
                            'codigo' => 'EXP-' . $e['id'],
                            'descricao' => $e['descricao'],
                            'data_lancamento' => $e['data_vencimento'],
                            'data_vencimento' => $e['data_vencimento'],
                            'data_liquidacao' => null, // Pendente
                            'valor' => (float) $e['valor'],
                            'cancelado' => false,
                            'sincronizado_em' => Carbon::now(),
                        ]
                    );
                    $processed++;
                }

                Lancamento::where('conexao_id', $conexao->id)
                    ->where('entidade_origem', 'expenses')
                    ->where('tipo', 'despesa')
                    ->whereNotIn('id_origem', $activePendingExpIds)
                    ->delete();
            } catch (\Throwable) {
            }

            // 6. Sincronização de monthly_closures para calibração de saldos históricos
            try {
                $closures = $pdo->query("SELECT * FROM monthly_closures ORDER BY year DESC, month DESC LIMIT 1")->fetchAll();
                if (!empty($closures)) {
                    $latestClosure = $closures[0];
                    $m = (int) $latestClosure['month'];
                    $y = (int) $latestClosure['year'];
                    $dt = sprintf('%04d-%02d-01', $y, $m);
                    DB::table('saldos_abertura')->updateOrInsert(
                        ['unidade_id' => $conexao->unidade_id],
                        [
                            'data_inicio' => $dt,
                            'valor' => (float) $latestClosure['closing_balance'],
                            'observacao' => "Fechamento mensal importado {$m}/{$y}",
                        ]
                    );
                }
            } catch (\Throwable) {
            }

            // Atualiza status da sincronização
            $sync->update([
                'status' => 'concluida',
                'registros_processados' => $processed,
                'finalizada_em' => Carbon::now(),
            ]);

            $conexao->update([
                'status' => 'online',
                'ultima_verificacao' => Carbon::now(),
            ]);

            return [
                'ok' => true,
                'processed' => $processed,
                'message' => "Sincronização concluída com sucesso: {$processed} movimentações importadas.",
            ];
        } catch (\Throwable $e) {
            $rawMsg = $e->getMessage();
            if ($decryptedPassword && strlen($decryptedPassword) > 3) {
                $rawMsg = str_replace($decryptedPassword, '******', $rawMsg);
            }
            $erroSanitizado = substr($rawMsg, 0, 480);

            $sync->update([
                'status' => 'falhou',
                'erro_sanitizado' => $erroSanitizado,
                'finalizada_em' => Carbon::now(),
            ]);

            $conexao->update([
                'status' => 'offline',
                'ultima_verificacao' => Carbon::now(),
            ]);

            return [
                'ok' => false,
                'processed' => $processed,
                'message' => "Falha na sincronização: {$erroSanitizado}",
            ];
        }
    }
}
