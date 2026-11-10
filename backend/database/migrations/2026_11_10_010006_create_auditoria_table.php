<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditoria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('unidade_id')->nullable()->constrained('unidades');
            $table->string('acao', 80);
            $table->string('entidade', 80);
            $table->string('entidade_id', 191)->nullable();
            $table->json('contexto')->nullable()->comment('Somente metadados sanitizados, nunca senhas/tokens');
            $table->timestamp('ocorrido_em')->useCurrent();

            $table->index(['unidade_id', 'ocorrido_em'], 'ix_auditoria_unidade');
            $table->index(['usuario_id', 'ocorrido_em'], 'ix_auditoria_usuario');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria');
    }
};

