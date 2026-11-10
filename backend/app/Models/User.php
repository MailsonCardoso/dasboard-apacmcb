<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nome',
        'email',
        'password',
        'ativo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'ativo' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function unidades()
    {
        return $this->belongsToMany(Unidade::class, 'usuario_unidade', 'usuario_id', 'unidade_id')
                    ->withPivot('perfil_id');
    }

    public function preferencias()
    {
        return $this->hasOne(PreferenciaUsuario::class, 'usuario_id');
    }
}
