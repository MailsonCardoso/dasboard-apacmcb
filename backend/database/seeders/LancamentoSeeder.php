<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Conexao;
use App\Models\Unidade;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LancamentoSeeder extends Seeder
{
    protected const REFERENCE_DATE = '2026-11-09';

    protected const INCOME_CATS = [
        'Vendas de produtos',
        'Prestação de serviços',
        'Contratos recorrentes',
        'Rendimentos financeiros',
        'Outras receitas',
    ];

    protected const EXPENSE_CATS = [
        'Folha de pagamento',
        'Fornecedores',
        'Aluguel',
        'Energia e água',
        'Impostos',
        'Marketing',
        'Tecnologia',
        'Manutenção',
    ];

    protected const INCOME_DESC = [
        'Vendas de produtos' => ['Venda balcão', 'Pedido atacado', 'Venda e-commerce'],
        'Prestação de serviços' => ['Consultoria técnica', 'Serviço de instalação', 'Suporte mensal'],
        'Contratos recorrentes' => ['Mensalidade contrato', 'Assinatura corporativa'],
        'Rendimentos financeiros' => ['Rendimento aplicação CDB', 'Juros conta remunerada'],
        'Outras receitas' => ['Reembolso de despesas', 'Venda de ativo'],
    ];

    protected const EXPENSE_DESC = [
        'Folha de pagamento' => ['Salários do mês', 'Encargos trabalhistas'],
        'Fornecedores' => ['Compra de mercadorias', 'Insumos operacionais'],
        'Aluguel' => ['Aluguel do imóvel'],
        'Energia e água' => ['Conta de energia', 'Conta de água'],
        'Impostos' => ['DAS / Simples', 'ISS municipal', 'ICMS'],
        'Marketing' => ['Campanha digital', 'Material gráfico'],
        'Tecnologia' => ['Licenças de software', 'Link de internet'],
        'Manutenção' => ['Manutenção predial', 'Manutenção de equipamentos'],
    ];

    protected const UNIT_SCALE = [
        1 => 1.8,
        2 => 1.2,
        3 => 1.0,
        4 => 0.75,
        5 => 0.6,
    ];

    public function run(): void
    {
        $unidades = Unidade::all();
        $conexoes = Conexao::all();
        $categorias = Categoria::all();

        if ($unidades->isEmpty() || $conexoes->isEmpty() || $categorias->isEmpty()) {
            return;
        }

        $catMap = [];
        foreach ($categorias as $cat) {
            $catMap[$cat->tipo][$cat->nome] = $cat->id;
        }

        $seed = 20261109;
        $rng = function () use (&$seed) {
            $seed = (int) fmod(((float) $seed * 1664525.0 + 1013904223.0), 4294967296.0);
            return (float) $seed / 4294967296.0;
        };

        $lancamentos = [];
        $ic = 1;
        $ec = 1;
        $refTimestamp = strtotime(self::REFERENCE_DATE);

        for ($year = 2025; $year <= 2026; $year++) {
            for ($month = 1; $month <= 12; $month++) {
                if ($year === 2026 && $month > 11) {
                    break;
                }

                foreach ($unidades as $u) {
                    $conn = $conexoes->firstWhere('unidade_id', $u->id);
                    $connId = $conn ? $conn->id : 1;
                    $scale = (self::UNIT_SCALE[$u->id] ?? 1.0) * (1.0 + ($year - 2025) * 0.08 + sin($month / 2.0) * 0.06);
                    $maxDay = ($year === 2026 && $month === 11) ? 9 : 28;

                    // 6 Receitas por unidade/mês
                    for ($k = 0; $k < 6; $k++) {
                        $catIdx = (int) floor($rng() * count(self::INCOME_CATS));
                        $catName = self::INCOME_CATS[$catIdx];
                        $descs = self::INCOME_DESC[$catName];
                        $desc = $descs[(int) floor($rng() * count($descs))];

                        $day = 1 + (int) floor($rng() * $maxDay);
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        $ageDays = ($refTimestamp - strtotime($date)) / 86400.0;
                        $received = ($ageDays > 45 || $rng() > 0.4);
                        $amount = round((4000.0 + $rng() * 22000.0) * $scale, 2);
                        $code = 'REC-' . str_pad((string) $ic, 5, '0', STR_PAD_LEFT);

                        $lancamentos[] = [
                            'unidade_id' => $u->id,
                            'conexao_id' => $connId,
                            'categoria_id' => $catMap['receita'][$catName],
                            'tipo' => 'receita',
                            'entidade_origem' => 'erp_financeiro',
                            'id_origem' => $code,
                            'codigo' => $code,
                            'descricao' => $desc,
                            'data_lancamento' => $date,
                            'data_vencimento' => null,
                            'data_liquidacao' => $received ? $date : null,
                            'valor' => $amount,
                            'cancelado' => false,
                            'sincronizado_em' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $ic++;
                    }

                    // 8 Despesas por unidade/mês
                    for ($k = 0; $k < 8; $k++) {
                        $catName = self::EXPENSE_CATS[$k % count(self::EXPENSE_CATS)];
                        $descs = self::EXPENSE_DESC[$catName];
                        $desc = $descs[(int) floor($rng() * count($descs))];

                        $day = 1 + (int) floor($rng() * $maxDay);
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        $dueDate = Carbon::parse($date)->addDays(5 + (int) floor($rng() * 20))->toDateString();

                        $base = ($catName === 'Folha de pagamento') ? 14000.0 : (($catName === 'Fornecedores') ? 9000.0 : 2500.0);
                        $paid = ($dueDate < '2026-10-01' || $rng() > 0.45);

                        $paymentDate = null;
                        if ($paid) {
                            $p = Carbon::parse($dueDate)->subDays((int) floor($rng() * 4))->toDateString();
                            $paymentDate = ($p > self::REFERENCE_DATE) ? self::REFERENCE_DATE : $p;
                        }

                        $amount = round($base * (0.7 + $rng() * 0.6) * $scale, 2);
                        $code = 'DES-' . str_pad((string) $ec, 5, '0', STR_PAD_LEFT);

                        $lancamentos[] = [
                            'unidade_id' => $u->id,
                            'conexao_id' => $connId,
                            'categoria_id' => $catMap['despesa'][$catName],
                            'tipo' => 'despesa',
                            'entidade_origem' => 'erp_financeiro',
                            'id_origem' => $code,
                            'codigo' => $code,
                            'descricao' => $desc,
                            'data_lancamento' => $date,
                            'data_vencimento' => $dueDate,
                            'data_liquidacao' => $paymentDate,
                            'valor' => $amount,
                            'cancelado' => false,
                            'sincronizado_em' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $ec++;
                    }
                }
            }
        }

        DB::table('lancamentos')->truncate();

        foreach (array_chunk($lancamentos, 500) as $chunk) {
            DB::table('lancamentos')->insert($chunk);
        }
    }
}

