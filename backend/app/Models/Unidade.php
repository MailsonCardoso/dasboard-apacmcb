<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Unidade extends Model
{
    use HasFactory;

    protected $table = 'unidades';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativa',
    ];

    protected $casts = [
        'ativa' => 'boolean',
    ];

    public function conexoes(): HasMany
    {
        return $this->hasMany(Conexao::class, 'unidade_id');
    }

    public function lancamentos(): HasMany
    {
        return $this->hasMany(Lancamento::class, 'unidade_id');
    }

    public function saldoAbertura(): HasOne
    {
        return $this->hasOne(SaldoAbertura::class, 'unidade_id');
    }

    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'usuario_unidade', 'unidade_id', 'usuario_id')
                    ->withPivot('perfil_id');
    }
}

