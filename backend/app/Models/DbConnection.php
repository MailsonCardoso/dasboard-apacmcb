<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DbConnection extends Model
{
    use HasFactory;

    protected $table = 'db_connections';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'unit_id',
        'type',
        'host',
        'port',
        'database',
        'user',
        'password',
        'password_mask',
        'description',
        'status',
        'last_check',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'port' => 'integer',
        'last_check' => 'datetime',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class, 'connection_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'connection_id');
    }
}

