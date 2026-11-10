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
        $conexao = \App\Models\Conexao::firstOrCreate(
            ['nome' => 'Conexão Teste Automatizado'],
            [
                'unidade_id' => 1,
                'tipo' => 'MySQL',
                'host' => '127.0.0.1',
                'porta' => 3306,
                'banco' => 'test_db',
                'usuario_leitura' => 'user_test',
                'senha_cifrada' => \Illuminate\Support\Facades\Crypt::encryptString('test_pwd'),
                'status' => 'offline',
            ]
        );

        $response = $this->postJson("/api/connections/{$conexao->id}/test");
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

    public function test_can_create_and_delete_unit(): void
    {
        $uniqueCode = 'TST-' . substr((string) time(), -6);
        $createResponse = $this->postJson('/api/units', [
            'name' => 'Unidade Teste Automatizado',
            'code' => $uniqueCode,
            'description' => 'Unidade criada pelo teste de integração',
            'active' => true,
        ]);

        $createResponse->assertStatus(201)
                       ->assertJsonStructure(['id', 'name', 'code', 'description', 'active']);

        $unitId = $createResponse->json('id');

        $deleteResponse = $this->deleteJson("/api/units/{$unitId}");
        $deleteResponse->assertStatus(200)
                       ->assertJson(['message' => 'Unidade excluída com sucesso.']);
    }
}
