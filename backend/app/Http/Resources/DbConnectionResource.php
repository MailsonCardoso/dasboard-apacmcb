<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DbConnectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->nome,
            'unitId' => (string) $this->unidade_id,
            'type' => $this->tipo,
            'host' => $this->host,
            'port' => (int) $this->porta,
            'database' => $this->banco,
            'user' => $this->usuario_leitura,
            'passwordMask' => '••••••••',
            'description' => $this->descricao ?? '',
            'status' => $this->status === 'nao_testada' ? 'online' : $this->status,
            'lastCheck' => $this->ultima_verificacao ? $this->ultima_verificacao->toIso8601String() : null,
        ];
    }
}
