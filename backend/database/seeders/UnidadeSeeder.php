<?php

namespace Database\Seeders;

use App\Models\Perfil;
use App\Models\Unidade;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnidadeSeeder extends Seeder
{
    public function run(): void
    {
        $unidades = [
            ['id' => 1, 'codigo' => 'MTZ-001', 'nome' => 'Matriz', 'descricao' => 'Sede administrativa e financeira', 'ativa' => true],
            ['id' => 2, 'codigo' => 'SLZ-002', 'nome' => 'Unidade São Luís', 'descricao' => 'Operação regional da capital', 'ativa' => true],
            ['id' => 3, 'codigo' => 'IMP-003', 'nome' => 'Unidade Imperatriz', 'descricao' => 'Polo comercial sudoeste', 'ativa' => true],
            ['id' => 4, 'codigo' => 'CXS-004', 'nome' => 'Unidade Caxias', 'descricao' => 'Filial leste', 'ativa' => true],
            ['id' => 5, 'codigo' => 'BAL-005', 'nome' => 'Unidade Balsas', 'descricao' => 'Filial sul — agronegócio', 'ativa' => false],
        ];

        foreach ($unidades as $u) {
            Unidade::updateOrCreate(['id' => $u['id']], $u);
        }

        // Vincular usuário admin a todas as unidades como administrador
        $user = User::where('email', 'admin@apacmcb.org.br')->first();
        $perfilAdmin = Perfil::where('codigo', 'administrador')->first();

        if ($user && $perfilAdmin) {
            foreach ($unidades as $u) {
                DB::table('usuario_unidade')->updateOrInsert(
                    ['usuario_id' => $user->id, 'unidade_id' => $u['id']],
                    ['perfil_id' => $perfilAdmin->id]
                );
            }
        }
    }
}

