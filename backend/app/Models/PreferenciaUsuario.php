<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreferenciaUsuario extends Model
{
    use HasFactory;

    protected $table = 'preferencias_usuario';
    public $timestamps = false;
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    protected $fillable = [
        'usuario_id',
        'alertar_conexoes',
        'destacar_vencidas',
        'abrir_todas_unidades',
        'resumo_semanal_email',
    ];

    protected $casts = [
        'alertar_conexoes' => 'boolean',
        'destacar_vencidas' => 'boolean',
        'abrir_todas_unidades' => 'boolean',
        'resumo_semanal_email' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}

