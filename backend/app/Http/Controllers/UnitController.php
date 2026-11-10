<?php

namespace App\Http\Controllers;

use App\Http\Resources\UnitResource;
use App\Models\Unidade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UnitController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Unidade::query();

        if ($request->has('active')) {
            $query->where('ativa', filter_var($request->query('active'), FILTER_VALIDATE_BOOLEAN));
        }

        return UnitResource::collection($query->get());
    }

    public function show(string $id): UnitResource
    {
        $id = str_replace('u', '', $id);
        $unit = Unidade::findOrFail($id);
        return new UnitResource($unit);
    }

    public function store(Request $request): JsonResponse
    {
        $nome = $request->input('nome') ?? $request->input('name');
        $codigo = $request->input('codigo') ?? $request->input('code');
        $descricao = $request->input('descricao') ?? $request->input('description');
        $ativa = $request->has('ativa') ? $request->boolean('ativa') : ($request->has('active') ? $request->boolean('active') : true);

        if (!$nome || !$codigo) {
            return response()->json(['message' => 'Nome e código são obrigatórios.'], 422);
        }

        if (Unidade::where('codigo', $codigo)->exists()) {
            return response()->json(['message' => "Já existe uma unidade com o código '{$codigo}'."], 422);
        }

        $unit = Unidade::create([
            'nome' => $nome,
            'codigo' => $codigo,
            'descricao' => $descricao,
            'ativa' => $ativa,
        ]);

        return response()->json(new UnitResource($unit), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $id = (int) str_replace('u', '', $id);
        $unit = Unidade::findOrFail($id);

        $nome = $request->input('nome') ?? $request->input('name') ?? $unit->nome;
        $codigo = $request->input('codigo') ?? $request->input('code') ?? $unit->codigo;
        $descricao = $request->input('descricao') ?? $request->input('description') ?? $unit->descricao;
        $ativa = $request->has('ativa') ? $request->boolean('ativa') : ($request->has('active') ? $request->boolean('active') : $unit->ativa);

        if ($codigo !== $unit->codigo && Unidade::where('codigo', $codigo)->where('id', '!=', $unit->id)->exists()) {
            return response()->json(['message' => "Já existe uma unidade com o código '{$codigo}'."], 422);
        }

        $unit->update([
            'nome' => $nome,
            'codigo' => $codigo,
            'descricao' => $descricao,
            'ativa' => $ativa,
        ]);

        return response()->json(new UnitResource($unit));
    }

    public function destroy(string $id): JsonResponse
    {
        $id = (int) str_replace('u', '', $id);
        $unit = Unidade::findOrFail($id);

        if ($unit->conexoes()->exists() || $unit->lancamentos()->exists()) {
            return response()->json([
                'message' => 'Esta unidade possui conexões ou lançamentos vinculados e não pode ser excluída. Desative-a ou exclua as conexões antes.',
            ], 422);
        }

        $unit->usuarios()->detach();
        $unit->delete();

        return response()->json(['message' => 'Unidade excluída com sucesso.']);
    }
}
