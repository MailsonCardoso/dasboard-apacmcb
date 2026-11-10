<?php

namespace App\Services;

use App\Models\Lancamento;
use Carbon\Carbon;

class FinanceService
{
    protected function getItemAmount($item): float
    {
        if ($item instanceof Lancamento) {
            return (float) $item->valor;
        }
        if (is_object($item)) {
            return (float) ($item->amount ?? $item->valor ?? 0);
        }
        return (float) ($item['amount'] ?? $item['valor'] ?? 0);
    }

    protected function getItemDate($item): string
    {
        if ($item instanceof Lancamento) {
            return substr((string) $item->data_lancamento, 0, 10);
        }
        if (is_object($item)) {
            $d = $item->date ?? $item->data_lancamento ?? '';
            return substr((string) $d, 0, 10);
        }
        $d = $item['date'] ?? $item['data_lancamento'] ?? '';
        return substr((string) $d, 0, 10);
    }

    protected function getItemPaymentDate($item): ?string
    {
        if ($item instanceof Lancamento) {
            return $item->data_liquidacao ? substr((string) $item->data_liquidacao, 0, 10) : null;
        }
        if (is_object($item)) {
            $d = $item->paymentDate ?? $item->payment_date ?? $item->data_liquidacao ?? null;
            return $d ? substr((string) $d, 0, 10) : null;
        }
        $d = $item['paymentDate'] ?? $item['payment_date'] ?? $item['data_liquidacao'] ?? null;
        return $d ? substr((string) $d, 0, 10) : null;
    }

    protected function getItemStatus($item, string $type = 'receita'): string
    {
        if ($item instanceof Lancamento) {
            if ($type === 'receita') {
                return $item->data_liquidacao ? 'Recebida' : 'Pendente';
            }
            if ($item->data_liquidacao) {
                return 'Paga';
            }
            $due = $item->data_vencimento ? substr((string) $item->data_vencimento, 0, 10) : null;
            return ($due && $due < date('Y-m-d')) ? 'Vencida' : 'Pendente';
        }

        if (is_object($item) && isset($item->status)) {
            return $item->status;
        }
        if (is_array($item) && isset($item['status'])) {
            return $item['status'];
        }

        $paid = $this->getItemPaymentDate($item);
        if ($type === 'receita') {
            return $paid ? 'Recebida' : 'Pendente';
        }
        return $paid ? 'Paga' : 'Pendente';
    }

    public function sum(iterable $values): float
    {
        $total = 0.0;
        foreach ($values as $val) {
            $total += (float) $val;
        }
        return round($total, 2);
    }

    public function totalIncome(iterable $incomes): float
    {
        $amounts = [];
        foreach ($incomes as $i) {
            $amounts[] = $this->getItemAmount($i);
        }
        return $this->sum($amounts);
    }

    public function receivedIncome(iterable $incomes): float
    {
        $amounts = [];
        foreach ($incomes as $i) {
            if ($this->getItemStatus($i, 'receita') === 'Recebida') {
                $amounts[] = $this->getItemAmount($i);
            }
        }
        return $this->sum($amounts);
    }

    public function pendingIncome(iterable $incomes): float
    {
        $amounts = [];
        foreach ($incomes as $i) {
            if ($this->getItemStatus($i, 'receita') === 'Pendente') {
                $amounts[] = $this->getItemAmount($i);
            }
        }
        return $this->sum($amounts);
    }

    public function totalExpense(iterable $expenses): float
    {
        $amounts = [];
        foreach ($expenses as $e) {
            $amounts[] = $this->getItemAmount($e);
        }
        return $this->sum($amounts);
    }

    public function paidExpense(iterable $expenses): float
    {
        $amounts = [];
        foreach ($expenses as $e) {
            if ($this->getItemStatus($e, 'despesa') === 'Paga') {
                $amounts[] = $this->getItemAmount($e);
            }
        }
        return $this->sum($amounts);
    }

    public function pendingExpense(iterable $expenses): float
    {
        $amounts = [];
        foreach ($expenses as $e) {
            if ($this->getItemStatus($e, 'despesa') !== 'Paga') {
                $amounts[] = $this->getItemAmount($e);
            }
        }
        return $this->sum($amounts);
    }

    public function overdueExpense(iterable $expenses): float
    {
        $amounts = [];
        foreach ($expenses as $e) {
            if ($this->getItemStatus($e, 'despesa') === 'Vencida') {
                $amounts[] = $this->getItemAmount($e);
            }
        }
        return $this->sum($amounts);
    }

    public function periodBalance(iterable $incomes, iterable $expenses): float
    {
        return round($this->receivedIncome($incomes) - $this->paidExpense($expenses), 2);
    }

    public function accumulatedBalance(iterable $incomes, iterable $expenses, string $until): float
    {
        $filteredIncomes = [];
        foreach ($incomes as $i) {
            if ($this->getItemDate($i) <= $until) {
                $filteredIncomes[] = $i;
            }
        }

        $filteredExpenses = [];
        foreach ($expenses as $e) {
            $payDate = $this->getItemPaymentDate($e);
            $effectiveDate = $payDate ?: $this->getItemDate($e);
            if ($effectiveDate <= $until) {
                $filteredExpenses[] = $e;
            }
        }

        return $this->periodBalance($filteredIncomes, $filteredExpenses);
    }

    public function periodEnd(int $year, int $month): string
    {
        if ($month === 0) {
            return "{$year}-12-31";
        }
        $lastDay = Carbon::createFromDate($year, $month, 1)->endOfMonth()->day;
        return sprintf('%04d-%02d-%02d', $year, $month, $lastDay);
    }

    public function previousPeriod(int $year, int $month): array
    {
        if ($month === 0) {
            return ['year' => $year - 1, 'month' => 0];
        }
        return $month === 1 ? ['year' => $year - 1, 'month' => 12] : ['year' => $year, 'month' => $month - 1];
    }

    public function pctChange(float $curr, float $prev): ?float
    {
        if ($prev == 0.0) {
            return $curr == 0.0 ? 0.0 : null;
        }
        return round((($curr - $prev) / abs($prev)) * 100, 2);
    }

    public function inPeriod(string $date, int $year, int $month): bool
    {
        $y = (int) substr($date, 0, 4);
        $m = (int) substr($date, 5, 2);
        return $y === $year && ($month === 0 || $m === $month);
    }

    public function groupByCategory(iterable $items): array
    {
        $map = [];
        foreach ($items as $item) {
            $cat = '';
            if ($item instanceof Lancamento) {
                $cat = $item->categoria ? $item->categoria->nome : 'Outras';
            } elseif (is_object($item)) {
                $cat = $item->category ?? ($item->categoria->nome ?? 'Outras');
            } elseif (is_array($item)) {
                $cat = $item['category'] ?? ($item['categoria'] ?? 'Outras');
            }

            $amt = $this->getItemAmount($item);
            $map[$cat] = ($map[$cat] ?? 0.0) + $amt;
        }

        $result = [];
        foreach ($map as $name => $value) {
            $result[] = ['name' => $name, 'value' => round($value, 2)];
        }

        usort($result, fn ($a, $b) => $b['value'] <=> $a['value']);
        return $result;
    }

    public function buildCashFlow(iterable $incomes, iterable $expenses, float $opening = 0.0): array
    {
        $moves = [];

        foreach ($incomes as $i) {
            if ($this->getItemStatus($i, 'receita') === 'Recebida') {
                $id = (string) ($i instanceof Lancamento ? $i->id : ($i->id ?? $i['id']));
                $date = $this->getItemDate($i);
                $code = (string) ($i instanceof Lancamento ? $i->codigo : ($i->code ?? $i['code'] ?? ''));
                $desc = (string) ($i instanceof Lancamento ? $i->descricao : ($i->description ?? $i['description'] ?? ''));
                $unitId = (string) ($i instanceof Lancamento ? $i->unidade_id : ($i->unitId ?? $i->unit_id ?? $i['unitId'] ?? $i['unit_id'] ?? '1'));
                $cat = $i instanceof Lancamento ? ($i->categoria->nome ?? '') : ($i->category ?? $i['category'] ?? '');
                $connId = (string) ($i instanceof Lancamento ? $i->conexao_id : ($i->connectionId ?? $i->connection_id ?? $i['connectionId'] ?? $i['connection_id'] ?? '1'));
                $amount = $this->getItemAmount($i);

                $moves[] = [
                    'id' => $id,
                    'date' => $date,
                    'code' => $code,
                    'description' => $desc,
                    'unitId' => $unitId,
                    'category' => $cat,
                    'type' => 'Entrada',
                    'inflow' => $amount,
                    'outflow' => 0.0,
                    'connectionId' => $connId,
                ];
            }
        }

        foreach ($expenses as $e) {
            if ($this->getItemStatus($e, 'despesa') === 'Paga') {
                $id = (string) ($e instanceof Lancamento ? $e->id : ($e->id ?? $e['id']));
                $payDate = $this->getItemPaymentDate($e);
                $date = $payDate ?: $this->getItemDate($e);
                $code = (string) ($e instanceof Lancamento ? $e->codigo : ($e->code ?? $e['code'] ?? ''));
                $desc = (string) ($e instanceof Lancamento ? $e->descricao : ($e->description ?? $e['description'] ?? ''));
                $unitId = (string) ($e instanceof Lancamento ? $e->unidade_id : ($e->unitId ?? $e->unit_id ?? $e['unitId'] ?? $e['unit_id'] ?? '1'));
                $cat = $e instanceof Lancamento ? ($e->categoria->nome ?? '') : ($e->category ?? $e['category'] ?? '');
                $connId = (string) ($e instanceof Lancamento ? $e->conexao_id : ($e->connectionId ?? $e->connection_id ?? $e['connectionId'] ?? $e['connection_id'] ?? '1'));
                $amount = $this->getItemAmount($e);

                $moves[] = [
                    'id' => $id,
                    'date' => $date,
                    'code' => $code,
                    'description' => $desc,
                    'unitId' => $unitId,
                    'category' => $cat,
                    'type' => 'Saída',
                    'inflow' => 0.0,
                    'outflow' => $amount,
                    'connectionId' => $connId,
                ];
            }
        }

        usort($moves, function ($a, $b) {
            $cmp = strcmp($a['date'], $b['date']);
            if ($cmp !== 0) {
                return $cmp;
            }
            return strcmp($a['code'], $b['code']);
        });

        $bal = $opening;
        $result = [];
        foreach ($moves as $m) {
            $bal = round(($bal + $m['inflow'] - $m['outflow']), 2);
            $m['balanceAfter'] = $bal;
            $result[] = $m;
        }

        return $result;
    }

    public function monthlySeries(iterable $incomes, iterable $expenses, int $year): array
    {
        $acc = $this->accumulatedBalance($incomes, $expenses, ($year - 1) . '-12-31');
        $series = [];

        for ($m = 1; $m <= 12; $m++) {
            $mi = [];
            foreach ($incomes as $i) {
                if ($this->inPeriod($this->getItemDate($i), $year, $m)) {
                    $mi[] = $i;
                }
            }

            $me = [];
            foreach ($expenses as $e) {
                if ($this->inPeriod($this->getItemDate($e), $year, $m)) {
                    $me[] = $e;
                }
            }

            $saldo = $this->periodBalance($mi, $me);
            $acc = round($acc + $saldo, 2);

            $series[] = [
                'month' => $m,
                'receitas' => $this->totalIncome($mi),
                'despesas' => $this->totalExpense($me),
                'saldo' => $saldo,
                'acumulado' => $acc,
            ];
        }

        return $series;
    }
}

function yearMatch(int $a, int $b): int
{
    return $a;
}
