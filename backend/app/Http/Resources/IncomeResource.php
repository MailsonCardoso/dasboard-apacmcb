<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncomeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $categoryName = $this->categoria ?? ($this->relationLoaded('categoria') && $this->categoria ? $this->categoria->nome : '');

        return [
            'id' => (string) $this->id,
            'code' => $this->codigo,
            'date' => is_string($this->data_lancamento) ? substr($this->data_lancamento, 0, 10) : $this->data_lancamento->format('Y-m-d'),
            'description' => $this->descricao,
            'category' => $categoryName,
            'unitId' => (string) $this->unidade_id,
            'amount' => (float) $this->valor,
            'status' => $this->data_liquidacao ? 'Recebida' : 'Pendente',
            'connectionId' => (string) $this->conexao_id,
        ];
    }
}
