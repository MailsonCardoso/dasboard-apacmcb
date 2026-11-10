<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perfis', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 40)->unique();
            $table->string('nome', 100);
        });

        Schema::create('permissoes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 80)->unique();
            $table->string('descricao', 255);
        });

        Schema::create('perfil_permissao', function (Blueprint $table) {
            $table->foreignId('perfil_id')->constrained('perfis')->cascadeOnDelete();
            $table->foreignId('permissao_id')->constrained('permissoes')->cascadeOnDelete();
            $table->primary(['perfil_id', 'permissao_id']);
        });

        Schema::create('usuario_unidade', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('unidade_id')->constrained('unidades');
            $table->foreignId('perfil_id')->constrained('perfis');
            $table->primary(['usuario_id', 'unidade_id']);
            $table->index(['unidade_id', 'usuario_id'], 'ix_vinculo_unidade');
        });

        Schema::create('preferencias_usuario', function (Blueprint $table) {
            $table->foreignId('usuario_id')->primary()->constrained('usuarios')->cascadeOnDelete();
            $table->boolean('alertar_conexoes')->default(true);
            $table->boolean('destacar_vencidas')->default(true);
            $table->boolean('abrir_todas_unidades')->default(true);
            $table->boolean('resumo_semanal_email')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preferencias_usuario');
        Schema::dropIfExists('usuario_unidade');
        Schema::dropIfExists('perfil_permissao');
        Schema::dropIfExists('permissoes');
        Schema::dropIfExists('perfis');
    }
};

