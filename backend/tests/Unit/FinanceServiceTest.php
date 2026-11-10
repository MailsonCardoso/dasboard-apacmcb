<?php

namespace Tests\Unit;

use App\Services\FinanceService;
use PHPUnit\Framework\TestCase;

class FinanceServiceTest extends TestCase
{
    protected FinanceService $finance;

    protected function setUp(): void
    {
        parent::setUp();
        $this->finance = new FinanceService();
    }

    protected function makeInc(float $amount, string $status, string $date = '2026-03-10', string $unitId = 'u1'): array
    {
        return [
            'id' => "{$amount}{$status}{$unitId}",
            'code' => 'R',
            'date' => $date,
            'description' => '',
            'category' => 'c',
            'unitId' => $unitId,
            'amount' => $amount,
            'status' => $status,
            'connectionId' => 'c1',
        ];
    }

    protected function makeExp(float $amount, string $status, string $date = '2026-03-10', string $unitId = 'u1'): array
    {
        return [
            'id' => "{$amount}{$status}{$unitId}",
            'code' => 'D',
            'date' => $date,
            'dueDate' => $date,
            'paymentDate' => $status === 'Paga' ? $date : null,
            'description' => '',
            'category' => 'c',
            'unitId' => $unitId,
            'amount' => $amount,
            'status' => $status,
            'connectionId' => 'c1',
        ];
    }

    public function test_saldo_mensal_ignora_receitas_pendentes_e_despesas_nao_pagas(): void
    {
        $incomes = [
            $this->makeInc(1000, 'Recebida'),
            $this->makeInc(500, 'Pendente'),
        ];

        $expenses = [
            $this->makeExp(300, 'Paga'),
            $this->makeExp(200, 'Pendente'),
            $this->makeExp(100, 'Vencida'),
        ];

        $balance = $this->finance->periodBalance($incomes, $expenses);
        $this->assertEquals(700.0, $balance);
    }

    public function test_saldo_acumulado_soma_historico_efetivado_ate_a_data(): void
    {
        $incomes = [
            $this->makeInc(1000, 'Recebida', '2026-01-05'),
            $this->makeInc(400, 'Recebida', '2026-02-05'),
        ];

        $expenses = [
            $this->makeExp(300, 'Paga', '2026-01-20'),
        ];

        $accJan = $this->finance->accumulatedBalance($incomes, $expenses, '2026-01-31');
        $this->assertEquals(700.0, $accJan);

        $accFeb = $this->finance->accumulatedBalance($incomes, $expenses, '2026-02-28');
        $this->assertEquals(1100.0, $accFeb);
    }

    public function test_fluxo_de_caixa_calcula_saldo_apos_cada_movimentacao(): void
    {
        $incomes = [
            $this->makeInc(1000, 'Recebida', '2026-03-01'),
            $this->makeInc(9, 'Pendente', '2026-03-01'),
        ];

        $expenses = [
            $this->makeExp(250, 'Paga', '2026-03-02'),
        ];

        $flow = $this->finance->buildCashFlow($incomes, $expenses, 100.0);
        $balances = array_column($flow, 'balanceAfter');

        $this->assertEquals([1100.0, 850.0], $balances);
    }
}

