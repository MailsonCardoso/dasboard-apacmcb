<?php

namespace Database\Seeders;

use App\Models\DbConnection;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Unit;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FinanceDataSeeder extends Seeder
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
        'u1' => 1.8,
        'u2' => 1.2,
        'u3' => 1.0,
        'u4' => 0.75,
        'u5' => 0.6,
    ];

    public function run(): void
    {
        $units = Unit::all();
        $connections = DbConnection::all();

        if ($units->isEmpty() || $connections->isEmpty()) {
            return;
        }

        $seed = 20261109;
        $rng = function () use (&$seed) {
            $seed = (int) fmod(((float) $seed * 1664525.0 + 1013904223.0), 4294967296.0);
            return (float) $seed / 4294967296.0;
        };

        $incomes = [];
        $expenses = [];
        $ic = 1;
        $ec = 1;

        $refTimestamp = strtotime(self::REFERENCE_DATE);

        for ($year = 2025; $year <= 2026; $year++) {
            for ($month = 1; $month <= 12; $month++) {
                if ($year === 2026 && $month > 11) {
                    break;
                }

                foreach ($units as $u) {
                    $conn = $connections->firstWhere('unit_id', $u->id);
                    $connId = $conn ? $conn->id : 'c1';
                    $scale = (self::UNIT_SCALE[$u->id] ?? 1.0) * (1.0 + ($year - 2025) * 0.08 + sin($month / 2.0) * 0.06);
                    $maxDay = ($year === 2026 && $month === 11) ? 9 : 28;

                    // 6 Incomes per unit/month
                    for ($k = 0; $k < 6; $k++) {
                        $catIdx = (int) floor($rng() * count(self::INCOME_CATS));
                        $cat = self::INCOME_CATS[$catIdx];
                        $descs = self::INCOME_DESC[$cat];
                        $desc = $descs[(int) floor($rng() * count($descs))];

                        $day = 1 + (int) floor($rng() * $maxDay);
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        $ageDays = ($refTimestamp - strtotime($date)) / 86400.0;
                        $status = ($ageDays > 45 || $rng() > 0.4) ? 'Recebida' : 'Pendente';
                        $amount = round((4000.0 + $rng() * 22000.0) * $scale, 2);

                        $incomes[] = [
                            'id' => "r{$ic}",
                            'code' => 'REC-' . str_pad((string) $ic, 5, '0', STR_PAD_LEFT),
                            'date' => $date,
                            'description' => $desc,
                            'category' => $cat,
                            'unit_id' => $u->id,
                            'connection_id' => $connId,
                            'amount' => $amount,
                            'status' => $status,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $ic++;
                    }

                    // 8 Expenses per unit/month
                    for ($k = 0; $k < 8; $k++) {
                        $cat = self::EXPENSE_CATS[$k % count(self::EXPENSE_CATS)];
                        $descs = self::EXPENSE_DESC[$cat];
                        $desc = $descs[(int) floor($rng() * count($descs))];

                        $day = 1 + (int) floor($rng() * $maxDay);
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        $dueDate = Carbon::parse($date)->addDays(5 + (int) floor($rng() * 20))->toDateString();

                        $base = ($cat === 'Folha de pagamento') ? 14000.0 : (($cat === 'Fornecedores') ? 9000.0 : 2500.0);
                        $paid = ($dueDate < '2026-10-01' || $rng() > 0.45);

                        $paymentDate = null;
                        if ($paid) {
                            $p = Carbon::parse($dueDate)->subDays((int) floor($rng() * 4))->toDateString();
                            $paymentDate = ($p > self::REFERENCE_DATE) ? self::REFERENCE_DATE : $p;
                        }

                        $status = $paid ? 'Paga' : ($dueDate < self::REFERENCE_DATE ? 'Vencida' : 'Pendente');
                        $amount = round($base * (0.7 + $rng() * 0.6) * $scale, 2);

                        $expenses[] = [
                            'id' => "d{$ec}",
                            'code' => 'DES-' . str_pad((string) $ec, 5, '0', STR_PAD_LEFT),
                            'date' => $date,
                            'due_date' => $dueDate,
                            'payment_date' => $paymentDate,
                            'description' => $desc,
                            'category' => $cat,
                            'unit_id' => $u->id,
                            'connection_id' => $connId,
                            'amount' => $amount,
                            'status' => $status,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $ec++;
                    }
                }
            }
        }

        Income::truncate();
        Expense::truncate();

        // Batch insert for performance
        foreach (array_chunk($incomes, 500) as $chunk) {
            DB::table('incomes')->insert($chunk);
        }

        foreach (array_chunk($expenses, 500) as $chunk) {
            DB::table('expenses')->insert($chunk);
        }
    }
}

