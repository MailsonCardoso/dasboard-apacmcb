<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lancamento extends Model
{
    use HasFactory;

    protected $table = 'lancamentos';

    protected $fillable = [
        'unidade_id',
        'conexao_id',
        'categoria_id',
        'tipo',
        'entidade_origem',
        'id_origem',
        'codigo',
        'descricao',
        'data_lancamento',
        'data_vencimento',
        'data_liquidacao',
        'valor',
        'cancelado',
        'sincronizado_em',
    ];

    protected $casts = [
        'valor' => 'float',
        'cancelado' => 'boolean',
        'sincronizado_em' => 'datetime',
        'data_lancamento' => 'date:Y-m-d',
        'data_vencimento' => 'date:Y-m-d',
        'data_liquidacao' => 'date:Y-m-d',
    ];

    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unidade::class, 'unidade_id');
    }

    public function conexao(): BelongsTo
    {
        return $this->belongsTo(Conexao::class, 'conexao_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
}

