<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $categoryName = $this->categoria instanceof \App\Models\Categoria
            ? $this->categoria->nome
            : (is_string($this->categoria) ? $this->categoria : ($this->categoria?->nome ?? 'Outras'));
        $dateStr = is_string($this->data_lancamento) ? substr($this->data_lancamento, 0, 10) : $this->data_lancamento->format('Y-m-d');
        $dueStr = $this->data_vencimento ? (is_string($this->data_vencimento) ? substr($this->data_vencimento, 0, 10) : $this->data_vencimento->format('Y-m-d')) : $dateStr;
        $payStr = $this->data_liquidacao ? (is_string($this->data_liquidacao) ? substr($this->data_liquidacao, 0, 10) : $this->data_liquidacao->format('Y-m-d')) : null;

        $status = $payStr ? 'Paga' : ($dueStr < date('Y-m-d') ? 'Vencida' : 'Pendente');

        return [
            'id' => (string) $this->id,
            'code' => $this->codigo,
            'date' => $dateStr,
            'dueDate' => $dueStr,
            'paymentDate' => $payStr,
            'description' => $this->descricao,
            'category' => (string) $categoryName,
            'unitId' => (string) $this->unidade_id,
            'amount' => (float) $this->valor,
            'status' => $status,
            'connectionId' => (string) $this->conexao_id,
        ];
    }
}
