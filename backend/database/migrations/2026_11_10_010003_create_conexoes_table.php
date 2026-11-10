<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conexoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unidade_id')->constrained('unidades');
            $table->string('nome', 150);
            $table->enum('tipo', ['MySQL', 'MariaDB', 'PostgreSQL', 'SQL Server', 'Oracle']);
            $table->string('host', 255);
            $table->unsignedSmallInteger('porta');
            $table->string('banco', 150);
            $table->string('usuario_leitura', 150);
            $table->text('senha_cifrada')->comment('Laravel Crypt; chave fora do banco e do código');
            $table->text('descricao')->nullable();
            $table->boolean('ativa')->default(true);
            $table->enum('status', ['nao_testada', 'online', 'instavel', 'offline'])->default('nao_testada');
            $table->dateTime('ultima_verificacao')->nullable();
            $table->timestamps();

            $table->unique(['unidade_id', 'nome'], 'uq_conexao_nome');
            $table->unique(['id', 'unidade_id'], 'uq_conexao_unidade');
        });

        Schema::create('verificacoes_conexao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conexao_id')->constrained('conexoes');
            $table->enum('status', ['online', 'instavel', 'offline']);
            $table->unsignedInteger('latencia_ms')->nullable();
            $table->string('mensagem', 500)->nullable()->comment('Mensagem sanitizada; sem credenciais ou SQL');
            $table->dateTime('verificado_em');

            $table->index(['conexao_id', 'verificado_em'], 'ix_verificacao');
        });

        Schema::create('sincronizacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conexao_id')->constrained('conexoes');
            $table->enum('status', ['executando', 'concluida', 'falhou'])->default('executando');
            $table->dateTime('iniciada_em');
            $table->dateTime('finalizada_em')->nullable();
            $table->unsignedInteger('registros_processados')->default(0);
            $table->string('cursor_origem', 255)->nullable();
            $table->string('erro_sanitizado', 500)->nullable();

            $table->index(['conexao_id', 'iniciada_em'], 'ix_sincronizacao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sincronizacoes');
        Schema::dropIfExists('verificacoes_conexao');
        Schema::dropIfExists('conexoes');
    }
};

