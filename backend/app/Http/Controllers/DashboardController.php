<?php

namespace App\Http\Controllers;

use App\Models\Lancamento;
use App\Services\FinanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    public function __construct(
        protected FinanceService $financeService
    ) {}

    public function summary(Request $request): JsonResponse
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

        // Período atual
        $currIncomes = $allIncomes->filter(fn ($i) => $this->financeService->inPeriod(substr($i->data_lancamento, 0, 10), $year, $month));
        $currExpenses = $allExpenses->filter(fn ($e) => $this->financeService->inPeriod(substr($e->data_lancamento, 0, 10), $year, $month));

        // Período anterior
        $prev = $this->financeService->previousPeriod($year, $month);
        $prevIncomes = $allIncomes->filter(fn ($i) => $this->financeService->inPeriod(substr($i->data_lancamento, 0, 10), $prev['year'], $prev['month']));
        $prevExpenses = $allExpenses->filter(fn ($e) => $this->financeService->inPeriod(substr($e->data_lancamento, 0, 10), $prev['year'], $prev['month']));

        // Totais
        $rec = $this->financeService->totalIncome($currIncomes);
        $recPrev = $this->financeService->totalIncome($prevIncomes);

        $des = $this->financeService->totalExpense($currExpenses);
        $desPrev = $this->financeService->totalExpense($prevExpenses);

        $saldo = $this->financeService->periodBalance($currIncomes, $currExpenses);
        $saldoPrev = $this->financeService->periodBalance($prevIncomes, $prevExpenses);

        $currEnd = $this->financeService->periodEnd($year, $month);
        $prevEnd = $this->financeService->periodEnd($prev['year'], $prev['month']);

        $acc = $this->financeService->accumulatedBalance($allIncomes, $allExpenses, $currEnd);
        $accPrev = $this->financeService->accumulatedBalance($allIncomes, $allExpenses, $prevEnd);

        $seriesRaw = $this->financeService->monthlySeries($allIncomes, $allExpenses, $year);
        $series = array_map(function ($s) {
            $s['label'] = self::MONTHS[$s['month'] - 1] ?? '';
            return $s;
        }, $seriesRaw);

        return response()->json([
            'rec' => $rec,
            'recPrev' => $recPrev,
            'recChange' => $this->financeService->pctChange($rec, $recPrev),
            'des' => $des,
            'desPrev' => $desPrev,
            'desChange' => $this->financeService->pctChange($des, $desPrev),
            'saldo' => $saldo,
            'saldoPrev' => $saldoPrev,
            'saldoChange' => $this->financeService->pctChange($saldo, $saldoPrev),
            'acc' => $acc,
            'accPrev' => $accPrev,
            'accChange' => $this->financeService->pctChange($acc, $accPrev),
            'series' => $series,
            'expCat' => $this->financeService->groupByCategory($currExpenses),
            'incCat' => $this->financeService->groupByCategory($currIncomes),
        ]);
    }
}
