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
        ]);

        // Mock data só é injetado explicitamente se solicitado
        if (env('SEED_MOCK_DATA', false)) {
            $this->call([
                ConexaoSeeder::class,
                LancamentoSeeder::class,
            ]);
        }
    }
}
