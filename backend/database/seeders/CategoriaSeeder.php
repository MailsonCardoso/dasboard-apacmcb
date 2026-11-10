<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            // Receitas
            ['tipo' => 'receita', 'nome' => 'Vendas de produtos'],
            ['tipo' => 'receita', 'nome' => 'Prestação de serviços'],
            ['tipo' => 'receita', 'nome' => 'Contratos recorrentes'],
            ['tipo' => 'receita', 'nome' => 'Rendimentos financeiros'],
            ['tipo' => 'receita', 'nome' => 'Outras receitas'],

            // Despesas
            ['tipo' => 'despesa', 'nome' => 'Folha de pagamento'],
            ['tipo' => 'despesa', 'nome' => 'Fornecedores'],
            ['tipo' => 'despesa', 'nome' => 'Aluguel'],
            ['tipo' => 'despesa', 'nome' => 'Energia e água'],
            ['tipo' => 'despesa', 'nome' => 'Impostos'],
            ['tipo' => 'despesa', 'nome' => 'Marketing'],
            ['tipo' => 'despesa', 'nome' => 'Tecnologia'],
            ['tipo' => 'despesa', 'nome' => 'Manutenção'],
        ];

        foreach ($categorias as $cat) {
            Categoria::firstOrCreate(['tipo' => $cat['tipo'], 'nome' => $cat['nome']], ['ativa' => true]);
        }
    }
}

