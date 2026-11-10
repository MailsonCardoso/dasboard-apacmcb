<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaldoAbertura extends Model
{
    use HasFactory;

    protected $table = 'saldos_abertura';
    public $timestamps = false;
    protected $primaryKey = 'unidade_id';
    public $incrementing = false;

    protected $fillable = [
        'unidade_id',
        'data_inicio',
        'valor',
        'observacao',
    ];

    protected $casts = [
        'valor' => 'float',
        'data_inicio' => 'date:Y-m-d',
    ];

    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unidade::class, 'unidade_id');
    }
}

