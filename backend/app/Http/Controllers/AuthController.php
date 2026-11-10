<?php

namespace App\Http\Controllers;

use App\Models\PreferenciaUsuario;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        if (!$user->ativo) {
            return response()->json([
                'message' => 'Esta conta de usuário está desativada.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $unidades = $user->unidades()->get()->map(function ($u) {
            return [
                'id' => (string) $u->id,
                'codigo' => $u->codigo,
                'nome' => $u->nome,
                'perfilId' => $u->pivot->perfil_id,
            ];
        });

        $preferencias = PreferenciaUsuario::firstOrCreate(
            ['usuario_id' => $user->id],
            [
                'alertar_conexoes' => true,
                'destacar_vencidas' => true,
                'abrir_todas_unidades' => true,
                'resumo_semanal_email' => false,
            ]
        );

        return response()->json([
            'token' => $token,
            'tokenType' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
            ],
            'unidades' => $unidades,
            'preferencias' => $preferencias,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $unidades = $user->unidades()->get()->map(function ($u) {
            return [
                'id' => (string) $u->id,
                'codigo' => $u->codigo,
                'nome' => $u->nome,
                'perfilId' => $u->pivot->perfil_id,
            ];
        });

        $preferencias = PreferenciaUsuario::firstOrCreate(
            ['usuario_id' => $user->id],
            [
                'alertar_conexoes' => true,
                'destacar_vencidas' => true,
                'abrir_todas_unidades' => true,
                'resumo_semanal_email' => false,
            ]
        );

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
            ],
            'unidades' => $unidades,
            'preferencias' => $preferencias,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sessão encerrada com sucesso.',
        ]);
    }
}

