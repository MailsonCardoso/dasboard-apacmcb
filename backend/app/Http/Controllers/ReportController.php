<?php

namespace App\Http\Controllers;

use App\Models\Lancamento;
use App\Models\Unidade;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    public function __construct(
        protected FinanceService $financeService
    ) {}

    public function compare(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', 2026);
        $month = (int) $request->query('month', 11);
        $selectedUnits = $request->query('units');

        $unitsQuery = Unidade::query();
        if ($selectedUnits) {
            $rawIds = is_array($selectedUnits) ? $selectedUnits : explode(',', (string) $selectedUnits);
            $cleanIds = array_map(fn ($id) => (int) str_replace('u', '', (string) $id), $rawIds);
            $unitsQuery->whereIn('id', $cleanIds);
        }
        $units = $unitsQuery->get();

        $allIncomes = Lancamento::with('categoria')->where('tipo', 'receita')->where('cancelado', false)->get();
        $allExpenses = Lancamento::with('categoria')->where('tipo', 'despesa')->where('cancelado', false)->get();

        $rows = [];
        $evolutionByUnit = [];

        foreach ($units as $u) {
            $uInc = $allIncomes->where('unidade_id', $u->id);
            $uExp = $allExpenses->where('unidade_id', $u->id);

            $periodInc = $uInc->filter(fn ($i) => $this->financeService->inPeriod(substr($i->data_lancamento, 0, 10), $year, $month));
            $periodExp = $uExp->filter(fn ($e) => $this->financeService->inPeriod(substr($e->data_lancamento, 0, 10), $year, $month));

            $rec = $this->financeService->totalIncome($periodInc);
            $des = $this->financeService->totalExpense($periodExp);
            $saldo = $this->financeService->periodBalance($periodInc, $periodExp);
            $periodEnd = $this->financeService->periodEnd($year, $month);
            $acc = $this->financeService->accumulatedBalance($uInc, $uExp, $periodEnd);

            $label = str_replace('Unidade ', '', $u->nome);
            $rows[] = [
                'id' => (string) $u->id,
                'label' => $label,
                'name' => $u->nome,
                'receitas' => $rec,
                'recebidas' => $this->financeService->receivedIncome($periodInc),
                'despesas' => $des,
                'pagas' => $this->financeService->paidExpense($periodExp),
                'saldo' => $saldo,
                'acumulado' => $acc,
                'margem' => $rec > 0 ? round((($rec - $des) / $rec) * 100, 1) : 0.0,
            ];

            $evolutionByUnit[$label] = $this->financeService->monthlySeries($uInc, $uExp, $year);
        }

        $evolution = [];
        for ($i = 0; $i < 12; $i++) {
            $item = ['label' => self::MONTHS[$i]];
            foreach ($evolutionByUnit as $unitLabel => $series) {
                $item[$unitLabel] = $series[$i]['saldo'] ?? 0.0;
            }
            $evolution[] = $item;
        }

        return response()->json([
            'rows' => $rows,
            'evolution' => $evolution,
        ]);
    }

    public function demonstrative(Request $request): JsonResponse
    {
        $rawUnitId = $request->query('unitId') ?? $request->query('unit_id', 'all');
        $unitId = ($rawUnitId && $rawUnitId !== 'all') ? (int) str_replace('u', '', (string) $rawUnitId) : null;

        $year = (int) $request->query('year', 2026);
        $month = (int) $request->query('month', 11);

        $incQuery = Lancamento::with('categoria')->where('tipo', 'receita')->where('cancelado', false);
        $expQuery = Lancamento::with('categoria')->where('tipo', 'despesa')->where('cancelado', false);

        if ($unitId !== null) {
            $incQuery->where('unidade_id', $unitId);
            $expQuery->where('unidade_id', $unitId);
        }

        $allIncomes = $incQuery->get();
        $allExpenses = $expQuery->get();

        $inc = $allIncomes->filter(fn ($i) => $this->financeService->inPeriod(substr($i->data_lancamento, 0, 10), $year, $month));
        $exp = $allExpenses->filter(fn ($e) => $this->financeService->inPeriod(substr($e->data_lancamento, 0, 10), $year, $month));

        $recLancadas = $this->financeService->totalIncome($inc);
        $recPendentes = $this->financeService->pendingIncome($inc);
        $recRecebidas = $this->financeService->receivedIncome($inc);

        $desLancadas = $this->financeService->totalExpense($exp);
        $desPendentes = $this->financeService->pendingExpense($exp);
        $desPagas = $this->financeService->paidExpense($exp);
        $desVencidas = $this->financeService->overdueExpense($exp);

        $saldoPeriodo = $this->financeService->periodBalance($inc, $exp);
        $periodEnd = $this->financeService->periodEnd($year, $month);
        $saldoAcumulado = $this->financeService->accumulatedBalance($allIncomes, $allExpenses, $periodEnd);

        return response()->json([
            ['item' => 'Receitas lançadas', 'valor' => $recLancadas],
            ['item' => '(−) Receitas pendentes', 'valor' => $recPendentes],
            ['item' => '= Receitas recebidas', 'valor' => $recRecebidas],
            ['item' => 'Despesas lançadas', 'valor' => $desLancadas],
            ['item' => '(−) Despesas a vencer / pendentes', 'valor' => $desPendentes],
            ['item' => 'Despesas vencidas (em aberto)', 'valor' => $desVencidas],
            ['item' => '= Despesas pagas', 'valor' => $desPagas],
            ['item' => '= Saldo líquido do período (recebido − pago)', 'valor' => $saldoPeriodo],
            ['item' => '= Saldo acumulado até o final do período', 'valor' => $saldoAcumulado],
        ]);
    }
}
