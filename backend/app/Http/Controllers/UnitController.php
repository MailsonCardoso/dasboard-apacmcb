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
        $validated = $request->validate([
            'nome' => 'required|string|max:150',
            'codigo' => 'required|string|max:30|unique:unidades,codigo',
            'descricao' => 'nullable|string',
            'ativa' => 'boolean',
        ]);

        $unit = Unidade::create($validated);
        return response()->json(new UnitResource($unit), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $id = str_replace('u', '', $id);
        $unit = Unidade::findOrFail($id);

        $validated = $request->validate([
            'nome' => 'sometimes|string|max:150',
            'codigo' => 'sometimes|string|max:30|unique:unidades,codigo,' . $unit->id,
            'descricao' => 'nullable|string',
            'ativa' => 'boolean',
        ]);

        $unit->update($validated);
        return response()->json(new UnitResource($unit));
    }

    public function destroy(string $id): JsonResponse
    {
        $id = str_replace('u', '', $id);
        $unit = Unidade::findOrFail($id);
        $unit->delete();
        return response()->json(['message' => 'Unidade excluída com sucesso.']);
    }
}
