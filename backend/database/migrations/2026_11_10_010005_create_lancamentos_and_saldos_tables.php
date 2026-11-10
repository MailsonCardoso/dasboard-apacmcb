<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lancamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unidade_id')->constrained('unidades');
            $table->unsignedBigInteger('conexao_id');
            $table->unsignedBigInteger('categoria_id');
            $table->enum('tipo', ['receita', 'despesa']);
            $table->string('entidade_origem', 100)->comment('Identificador fixo do adaptador, não SQL');
            $table->string('id_origem', 191);
            $table->string('codigo', 60);
            $table->string('descricao', 500);
            $table->date('data_lancamento')->comment('Competência utilizada nas telas atuais');
            $table->date('data_vencimento')->nullable();
            $table->date('data_liquidacao')->nullable()->comment('Recebimento ou pagamento efetivo');
            $table->decimal('valor', 18, 2);
            $table->boolean('cancelado')->default(false);
            $table->dateTime('sincronizado_em');
            $table->timestamps();

            $table->foreign(['conexao_id', 'unidade_id'])->references(['id', 'unidade_id'])->on('conexoes');
            $table->foreign(['categoria_id', 'tipo'])->references(['id', 'tipo'])->on('categorias');

            $table->unique(['conexao_id', 'entidade_origem', 'tipo', 'id_origem'], 'uq_origem');
            $table->index(['unidade_id', 'data_lancamento', 'tipo'], 'ix_competencia');
            $table->index(['unidade_id', 'data_liquidacao', 'tipo'], 'ix_liquidacao');
            $table->index(['unidade_id', 'cancelado', 'data_liquidacao', 'data_vencimento'], 'ix_vencimento');
        });

        Schema::create('saldos_abertura', function (Blueprint $table) {
            $table->foreignId('unidade_id')->primary()->constrained('unidades');
            $table->date('data_inicio');
            $table->decimal('valor', 18, 2)->default(0);
            $table->string('observacao', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saldos_abertura');
        Schema::dropIfExists('lancamentos');
    }
};

