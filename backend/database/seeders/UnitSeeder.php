<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['id' => 'u1', 'name' => 'Matriz', 'code' => 'MTZ-001', 'description' => 'Sede administrativa e financeira', 'active' => true],
            ['id' => 'u2', 'name' => 'Unidade São Luís', 'code' => 'SLZ-002', 'description' => 'Operação regional da capital', 'active' => true],
            ['id' => 'u3', 'name' => 'Unidade Imperatriz', 'code' => 'IMP-003', 'description' => 'Polo comercial sudoeste', 'active' => true],
            ['id' => 'u4', 'name' => 'Unidade Caxias', 'code' => 'CXS-004', 'description' => 'Filial leste', 'active' => true],
            ['id' => 'u5', 'name' => 'Unidade Balsas', 'code' => 'BAL-005', 'description' => 'Filial sul — agronegócio', 'active' => false],
        ];

        foreach ($units as $u) {
            Unit::updateOrCreate(['id' => $u['id']], $u);
        }
    }
}

