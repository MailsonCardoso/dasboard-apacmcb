<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->codigo,
            'name' => $this->nome,
            'description' => $this->descricao ?? '',
            'active' => (bool) $this->ativa,
        ];
    }
}
