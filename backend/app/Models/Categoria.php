<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory;

    protected $table = 'categorias';
    public $timestamps = false;

    protected $fillable = [
        'tipo',
        'nome',
        'ativa',
    ];

    protected $casts = [
        'ativa' => 'boolean',
    ];

    public function lancamentos(): HasMany
    {
        return $this->hasMany(Lancamento::class, 'categoria_id');
    }
}

