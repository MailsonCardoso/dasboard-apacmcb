<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sincronizacao extends Model
{
    use HasFactory;

    protected $table = 'sincronizacoes';
    public $timestamps = false;

    protected $fillable = [
        'conexao_id',
        'status',
        'iniciada_em',
        'finalizada_em',
        'registros_processados',
        'cursor_origem',
        'erro_sanitizado',
    ];

    protected $casts = [
        'iniciada_em' => 'datetime',
        'finalizada_em' => 'datetime',
        'registros_processados' => 'integer',
    ];

    public function conexao()
    {
        return $this->belongsTo(Conexao::class, 'conexao_id');
    }
}

