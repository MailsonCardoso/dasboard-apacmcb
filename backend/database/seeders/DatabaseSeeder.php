<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RbacSeeder::class,
            CategoriaSeeder::class,
            UnidadeSeeder::class,
            ConexaoSeeder::class,
            LancamentoSeeder::class,
        ]);
    }
}
