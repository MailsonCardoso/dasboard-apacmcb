<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExpenseResource;
use App\Models\Categoria;
use App\Models\Lancamento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Lancamento::with('categoria')
            ->where('tipo', 'despesa')
            ->where('cancelado', false);

        $rawUnitId = $request->query('unitId') ?? $request->query('unit_id');
        if ($rawUnitId && $rawUnitId !== 'all') {
            $unitId = (int) str_replace('u', '', (string) $rawUnitId);
            $query->where('unidade_id', $unitId);
        }

        $from = $request->query('from');
        $to = $request->query('to');

        if ($from || $to) {
            if ($from) {
                $query->where('data_lancamento', '>=', $from);
            }
            if ($to) {
                $query->where('data_lancamento', '<=', $to);
            }
        } elseif ($request->has('year')) {
            $year = (int) $request->query('year');
            $month = (int) $request->query('month', 0);

            $query->whereYear('data_lancamento', $year);
            if ($month > 0) {
                $query->whereMonth('data_lancamento', $month);
            }
        }

        $cat = $request->query('category') ?? $request->query('cat');
        if ($cat && $cat !== 'all') {
            $query->whereHas('categoria', function ($q) use ($cat) {
                $q->where('nome', $cat);
            });
        }

        $status = $request->query('status');
        if ($status && $status !== 'all') {
            $today = date('Y-m-d');
            if ($status === 'Paga') {
                $query->whereNotNull('data_liquidacao');
            } elseif ($status === 'Vencida') {
                $query->whereNull('data_liquidacao')->where('data_vencimento', '<', $today);
            } elseif ($status === 'Pendente') {
                $query->whereNull('data_liquidacao')->where(function ($q) use ($today) {
                    $q->whereNull('data_vencimento')->orWhere('data_vencimento', '>=', $today);
                });
            }
        }

        $search = $request->query('search') ?? $request->query('q');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('descricao', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%");
            });
        }

        $expenses = $query->orderBy('data_lancamento', 'desc')->get();
        return ExpenseResource::collection($expenses);
    }

    public function show(string $id): ExpenseResource
    {
        $id = (int) str_replace('d', '', $id);
        $expense = Lancamento::with('categoria')->where('tipo', 'despesa')->findOrFail($id);
        return new ExpenseResource($expense);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:60',
            'date' => 'required|date',
            'dueDate' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'paymentDate' => 'nullable|date',
            'payment_date' => 'nullable|date',
            'description' => 'required|string|max:500',
            'category' => 'required|string|max:150',
            'unitId' => 'sometimes',
            'connectionId' => 'sometimes',
            'amount' => 'required|numeric|min:0.01',
            'status' => 'required|in:Paga,Pendente,Vencida',
        ]);

        $rawUnitId = $validated['unitId'] ?? 1;
        $unidadeId = (int) str_replace('u', '', (string) $rawUnitId);

        $rawConnId = $validated['connectionId'] ?? 1;
        $connId = (int) str_replace('c', '', (string) $rawConnId);

        $dueDate = $validated['dueDate'] ?? $validated['due_date'] ?? $validated['date'];
        $paymentDate = $validated['paymentDate'] ?? $validated['payment_date'] ?? ($validated['status'] === 'Paga' ? $dueDate : null);

        $categoria = Categoria::firstOrCreate(
            ['tipo' => 'despesa', 'nome' => $validated['category']],
            ['ativa' => true]
        );

        $lancamento = Lancamento::create([
            'unidade_id' => $unidadeId,
            'conexao_id' => $connId,
            'categoria_id' => $categoria->id,
            'tipo' => 'despesa',
            'entidade_origem' => 'manual',
            'id_origem' => $validated['code'],
            'codigo' => $validated['code'],
            'descricao' => $validated['description'],
            'data_lancamento' => $validated['date'],
            'data_vencimento' => $dueDate,
            'data_liquidacao' => $paymentDate,
            'valor' => $validated['amount'],
            'cancelado' => false,
            'sincronizado_em' => now(),
        ]);

        $lancamento->load('categoria');
        return response()->json(new ExpenseResource($lancamento), 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $id = (int) str_replace('d', '', $id);
        $expense = Lancamento::where('tipo', 'despesa')->findOrFail($id);
        $expense->update(['cancelado' => true]);
        return response()->json(['message' => 'Despesa cancelada com sucesso.']);
    }
}
