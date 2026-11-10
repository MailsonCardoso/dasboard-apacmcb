<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Conexao extends Model
{
    use HasFactory;

    protected $table = 'conexoes';

    protected $fillable = [
        'unidade_id',
        'nome',
        'tipo',
        'host',
        'porta',
        'banco',
        'usuario_leitura',
        'senha_cifrada',
        'descricao',
        'ativa',
        'status',
        'ultima_verificacao',
    ];

    protected $hidden = [
        'senha_cifrada',
    ];

    protected $casts = [
        'porta' => 'integer',
        'ativa' => 'boolean',
        'ultima_verificacao' => 'datetime',
    ];

    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unidade::class, 'unidade_id');
    }

    public function verificacoes(): HasMany
    {
        return $this->hasMany(VerificacaoConexao::class, 'conexao_id');
    }

    public function sincronizacoes(): HasMany
    {
        return $this->hasMany(Sincronizacao::class, 'conexao_id');
    }

    public function lancamentos(): HasMany
    {
        return $this->hasMany(Lancamento::class, 'conexao_id');
    }

    public function setSenhaAttribute(?string $value): void
    {
        if (!empty($value)) {
            $this->attributes['senha_cifrada'] = Crypt::encryptString($value);
        }
    }
}

