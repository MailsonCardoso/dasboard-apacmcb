<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['receita', 'despesa']);
            $table->string('nome', 150);
            $table->boolean('ativa')->default(true);

            $table->unique(['tipo', 'nome'], 'uq_categoria');
            $table->unique(['id', 'tipo'], 'uq_categoria_tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias');
    }
};

