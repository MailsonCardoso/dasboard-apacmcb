<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashFlowController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DbConnectionController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - FinanceControl REST API
|--------------------------------------------------------------------------
| Banco: hgm21923_dasboard_apacmcb
| Acesso somente leitura aos bancos integrados das unidades.
*/

// Autenticação (Sanctum)
Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

// Preferências do Usuário
Route::get('preferences', [PreferenceController::class, 'show']);
Route::patch('preferences', [PreferenceController::class, 'update']);

// Unidades
Route::apiResource('units', UnitController::class);

// Conexões de Banco de Dados
Route::post('connections/sync', [DbConnectionController::class, 'syncAll']);
Route::post('connections/{id}/test', [DbConnectionController::class, 'test']);
Route::post('connections/{id}/sync', [DbConnectionController::class, 'sync']);
Route::apiResource('connections', DbConnectionController::class);

// Receitas e Despesas (consultas sobre a tabela unificada 'lancamentos' e views)
Route::apiResource('incomes', IncomeController::class);
Route::apiResource('expenses', ExpenseController::class);

// Fluxo de Caixa
Route::get('cash-flow', [CashFlowController::class, 'index']);

// Dashboard
Route::get('dashboard', [DashboardController::class, 'summary']);
Route::get('dashboard/summary', [DashboardController::class, 'summary']);

// Relatórios e Comparativos
Route::get('comparisons', [ReportController::class, 'compare']);
Route::get('reports', [ReportController::class, 'compare']);
Route::get('reports/compare', [ReportController::class, 'compare']);
Route::get('reports/demonstrative', [ReportController::class, 'demonstrative']);
