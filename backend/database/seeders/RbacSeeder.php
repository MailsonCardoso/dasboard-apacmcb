<?php

namespace Database\Seeders;

use App\Models\Perfil;
use App\Models\Permissao;
use App\Models\PreferenciaUsuario;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $perfisData = [
            ['id' => 1, 'codigo' => 'administrador', 'nome' => 'Administrador da unidade'],
            ['id' => 2, 'codigo' => 'controller', 'nome' => 'Controller'],
            ['id' => 3, 'codigo' => 'consulta', 'nome' => 'Consulta'],
        ];

        foreach ($perfisData as $p) {
            Perfil::updateOrCreate(['id' => $p['id']], $p);
        }

        $permissoesData = [
            ['id' => 1, 'codigo' => 'financeiro.consultar', 'descricao' => 'Consultar receitas, despesas, saldos e comparativos'],
            ['id' => 2, 'codigo' => 'relatorios.exportar', 'descricao' => 'Exportar relatórios das unidades autorizadas'],
            ['id' => 3, 'codigo' => 'conexoes.gerenciar', 'descricao' => 'Cadastrar, editar, desativar e testar conexões'],
            ['id' => 4, 'codigo' => 'unidades.gerenciar', 'descricao' => 'Editar cadastro da unidade'],
            ['id' => 5, 'codigo' => 'usuarios.gerenciar', 'descricao' => 'Gerenciar vínculos e perfis dentro da unidade'],
        ];

        foreach ($permissoesData as $perm) {
            Permissao::updateOrCreate(['id' => $perm['id']], $perm);
        }

        // Vínculos Perfil-Permissão
        // 1. Administrador tem todas
        $admin = Perfil::where('codigo', 'administrador')->first();
        $admin->permissoes()->sync(Permissao::pluck('id')->toArray());

        // 2. Controller tem financeiro.consultar e relatorios.exportar
        $controller = Perfil::where('codigo', 'controller')->first();
        $controller->permissoes()->sync(
            Permissao::whereIn('codigo', ['financeiro.consultar', 'relatorios.exportar'])->pluck('id')->toArray()
        );

        // 3. Consulta tem financeiro.consultar
        $consulta = Perfil::where('codigo', 'consulta')->first();
        $consulta->permissoes()->sync(
            Permissao::where('codigo', 'financeiro.consultar')->pluck('id')->toArray()
        );

        // Usuário Administrador
        $user = User::updateOrCreate(
            ['email' => 'admin@apacmcb.org.br'],
            [
                'nome' => 'Administrador APACMCB',
                'password' => Hash::make('Admin@2026!'),
                'ativo' => true,
            ]
        );

        PreferenciaUsuario::updateOrCreate(
            ['usuario_id' => $user->id],
            [
                'alertar_conexoes' => true,
                'destacar_vencidas' => true,
                'abrir_todas_unidades' => true,
                'resumo_semanal_email' => false,
            ]
        );
    }
}

