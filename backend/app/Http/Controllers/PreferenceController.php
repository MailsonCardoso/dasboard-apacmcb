<?php

namespace App\Http\Controllers;

use App\Models\PreferenciaUsuario;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    protected function resolveUser(Request $request): User
    {
        return $request->user() ?? User::where('email', 'admin@apacmcb.org.br')->first() ?? User::first();
    }

    public function show(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $prefs = PreferenciaUsuario::firstOrCreate(
            ['usuario_id' => $user->id],
            [
                'alertar_conexoes' => true,
                'destacar_vencidas' => true,
                'abrir_todas_unidades' => true,
                'resumo_semanal_email' => false,
            ]
        );

        return response()->json($prefs);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $validated = $request->validate([
            'alertar_conexoes' => 'sometimes|boolean',
            'destacar_vencidas' => 'sometimes|boolean',
            'abrir_todas_unidades' => 'sometimes|boolean',
            'resumo_semanal_email' => 'sometimes|boolean',
        ]);

        $prefs = PreferenciaUsuario::updateOrCreate(
            ['usuario_id' => $user->id],
            $validated
        );

        return response()->json($prefs);
    }
}

