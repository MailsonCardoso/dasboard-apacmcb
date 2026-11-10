<?php

namespace App\Http\Controllers;

use App\Models\Lancamento;
use App\Services\FinanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashFlowController extends Controller
{
    public function __construct(
        protected FinanceService $financeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $rawUnitId = $request->query('unitId') ?? $request->query('unit_id', 'all');
        $unitId = ($rawUnitId && $rawUnitId !== 'all') ? (int) str_replace('u', '', (string) $rawUnitId) : null;

        $year = (int) $request->query('year', 2026);
        $month = (int) $request->query('month', 11);
        $type = $request->query('type', 'all');
        $search = strtolower(trim((string) ($request->query('search') ?? $request->query('q', ''))));

        $incQuery = Lancamento::with('categoria')->where('tipo', 'receita')->where('cancelado', false);
        $expQuery = Lancamento::with('categoria')->where('tipo', 'despesa')->where('cancelado', false);

        if ($unitId !== null) {
            $incQuery->where('unidade_id', $unitId);
            $expQuery->where('unidade_id', $unitId);
        }

        $allIncomes = $incQuery->get();
        $allExpenses = $expQuery->get();

        $startMonth = $month > 0 ? $month : 1;
        $startStr = sprintf('%04d-%02d-01', $year, $startMonth);
        $dayBefore = Carbon::parse($startStr)->subDay()->toDateString();

        $opening = $this->financeService->accumulatedBalance($allIncomes, $allExpenses, $dayBefore);
        $allMoves = $this->financeService->buildCashFlow($allIncomes, $allExpenses, 0.0);

        $inside = array_filter($allMoves, function ($m) use ($year, $month) {
            return $this->financeService->inPeriod($m['date'], $year, $month);
        });

        $bal = $opening;
        $flow = [];
        foreach ($inside as $m) {
            $bal = round(($bal + $m['inflow'] - $m['outflow']), 2);
            $m['balanceAfter'] = $bal;
            $flow[] = $m;
        }

        if ($type !== 'all') {
            $flow = array_values(array_filter($flow, fn ($m) => $m['type'] === $type));
        }

        if ($search !== '') {
            $flow = array_values(array_filter($flow, function ($m) use ($search) {
                return str_contains(strtolower($m['description']), $search) ||
                    str_contains(strtolower($m['code']), $search) ||
                    str_contains(strtolower($m['category']), $search);
            }));
        }

        $inflow = round(array_sum(array_column($flow, 'inflow')), 2);
        $outflow = round(array_sum(array_column($flow, 'outflow')), 2);
        $closing = count($flow) > 0 ? end($flow)['balanceAfter'] : $opening;

        return response()->json([
            'opening' => $opening,
            'flow' => $flow,
            'inflow' => $inflow,
            'outflow' => $outflow,
            'closing' => $closing,
        ]);
    }
}
