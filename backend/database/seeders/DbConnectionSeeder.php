<?php

namespace Database\Seeders;

use App\Models\DbConnection;
use Illuminate\Database\Seeder;

class DbConnectionSeeder extends Seeder
{
    public function run(): void
    {
        $connections = [
            ['id' => 'c1', 'name' => 'Banco Financeiro Matriz', 'unit_id' => 'u1', 'type' => 'MySQL', 'host' => '192.168.1.100', 'port' => 3306, 'database' => 'financeiro_db', 'user' => 'consulta_financeira', 'password_mask' => '••••••••••', 'description' => 'Base principal do ERP da matriz', 'status' => 'online', 'last_check' => '2026-11-09 18:42:00'],
            ['id' => 'c2', 'name' => 'Contábil Matriz', 'unit_id' => 'u1', 'type' => 'PostgreSQL', 'host' => '10.0.0.15', 'port' => 5432, 'database' => 'contabil', 'user' => 'ro_contabil', 'password_mask' => '••••••••', 'description' => 'Lançamentos contábeis consolidados', 'status' => 'online', 'last_check' => '2026-11-09 18:40:00'],
            ['id' => 'c3', 'name' => 'Financeiro São Luís', 'unit_id' => 'u2', 'type' => 'MariaDB', 'host' => 'slz-db.interno.local', 'port' => 3306, 'database' => 'fin_slz', 'user' => 'leitura_slz', 'password_mask' => '•••••••••', 'description' => 'ERP regional São Luís', 'status' => 'online', 'last_check' => '2026-11-09 18:35:00'],
            ['id' => 'c4', 'name' => 'Financeiro Imperatriz', 'unit_id' => 'u3', 'type' => 'SQL Server', 'host' => '192.168.20.8', 'port' => 1433, 'database' => 'FinanceiroIMP', 'user' => 'svc_readonly', 'password_mask' => '•••••••••••', 'description' => 'Sistema legado Imperatriz', 'status' => 'instavel', 'last_check' => '2026-11-09 17:58:00'],
            ['id' => 'c5', 'name' => 'Financeiro Caxias', 'unit_id' => 'u4', 'type' => 'MySQL', 'host' => '192.168.30.12', 'port' => 3306, 'database' => 'caxias_fin', 'user' => 'consulta', 'password_mask' => '••••••••', 'description' => 'ERP filial Caxias', 'status' => 'online', 'last_check' => '2026-11-09 18:30:00'],
            ['id' => 'c6', 'name' => 'Financeiro Balsas', 'unit_id' => 'u5', 'type' => 'Oracle', 'host' => 'bal-ora.interno.local', 'port' => 1521, 'database' => 'BALFIN', 'user' => 'RO_FIN', 'password_mask' => '••••••••••', 'description' => 'Base Oracle filial Balsas', 'status' => 'offline', 'last_check' => '2026-11-08 22:10:00'],
        ];

        foreach ($connections as $c) {
            DbConnection::updateOrCreate(['id' => $c['id']], $c);
        }
    }
}

