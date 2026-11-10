<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificacaoConexao extends Model
{
    use HasFactory;

    protected $table = 'verificacoes_conexao';
    public $timestamps = false;

    protected $fillable = [
        'conexao_id',
        'status',
        'latencia_ms',
        'mensagem',
        'verificado_em',
    ];

    protected $casts = [
        'latencia_ms' => 'integer',
        'verificado_em' => 'datetime',
    ];

    public function conexao()
    {
        return $this->belongsTo(Conexao::class, 'conexao_id');
    }
}

