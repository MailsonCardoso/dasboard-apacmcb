<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Auditoria extends Model
{
    use HasFactory;

    protected $table = 'auditoria';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'unidade_id',
        'acao',
        'entidade',
        'entidade_id',
        'contexto',
        'ocorrido_em',
    ];

    protected $casts = [
        'contexto' => 'array',
        'ocorrido_em' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unidade::class, 'unidade_id');
    }
}

