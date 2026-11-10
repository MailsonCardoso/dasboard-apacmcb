<?php

namespace Tests\Feature;

use Tests\TestCase;

class FinanceApiTest extends TestCase
{
    public function test_can_authenticate_user(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@apacmcb.org.br',
            'password' => 'Admin@2026!',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'token', 'tokenType', 'user' => ['id', 'nome', 'email'], 'unidades', 'preferencias'
                 ]);
    }

    public function test_can_get_and_update_preferences(): void
    {
        $getResponse = $this->getJson('/api/preferences');
        $getResponse->assertStatus(200)
                    ->assertJsonStructure(['alertar_conexoes', 'destacar_vencidas', 'abrir_todas_unidades']);

        $patchResponse = $this->patchJson('/api/preferences', [
            'alertar_conexoes' => false,
        ]);
        $patchResponse->assertStatus(200)
                      ->assertJson([
                          'alertar_conexoes' => false,
                      ]);
    }

    public function test_can_list_units(): void
    {
        $response = $this->getJson('/api/units');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'code', 'description', 'active']
                 ]);
    }

    public function test_can_list_connections(): void
    {
        $response = $this->getJson('/api/connections');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'unitId', 'type', 'host', 'port', 'database', 'user', 'passwordMask', 'description', 'status', 'lastCheck']
                 ]);
    }

    public function test_can_test_connection(): void
    {
        $response = $this->postJson('/api/connections/1/test');
        $response->assertStatus(200)
                 ->assertJsonStructure(['ok', 'message', 'lastCheck']);
    }

    public function test_can_list_incomes(): void
    {
        $response = $this->getJson('/api/incomes?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'code', 'date', 'description', 'category', 'unitId', 'amount', 'status', 'connectionId']
                 ]);
    }

    public function test_can_list_expenses(): void
    {
        $response = $this->getJson('/api/expenses?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'code', 'date', 'dueDate', 'paymentDate', 'description', 'category', 'unitId', 'amount', 'status', 'connectionId']
                 ]);
    }

    public function test_dashboard_summary(): void
    {
        $response = $this->getJson('/api/dashboard?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'rec', 'recPrev', 'recChange',
                     'des', 'desPrev', 'desChange',
                     'saldo', 'saldoPrev', 'saldoChange',
                     'acc', 'accPrev', 'accChange',
                     'series', 'expCat', 'incCat'
                 ]);
    }

    public function test_cash_flow(): void
    {
        $response = $this->getJson('/api/cash-flow?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'opening', 'flow', 'inflow', 'outflow', 'closing'
                 ]);
    }

    public function test_reports_compare(): void
    {
        $response = $this->getJson('/api/comparisons?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'rows' => [
                         '*' => ['id', 'label', 'name', 'receitas', 'recebidas', 'despesas', 'pagas', 'saldo', 'acumulado', 'margem']
                     ],
                     'evolution'
                 ]);
    }

    public function test_reports_demonstrative(): void
    {
        $response = $this->getJson('/api/reports/demonstrative?year=2026&month=11');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['item', 'valor']
                 ]);
    }
}
