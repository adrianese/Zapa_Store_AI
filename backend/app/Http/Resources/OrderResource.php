<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'total_minor' => $this->total_minor,
            'currency' => $this->currency,
            'items' => $this->items,
            'created_at' => $this->created_at,
            'user_name' => $this->buyer->name, // Dato del comprador
            'user_email' => $this->buyer->email, // Dato del comprador
            // Puedes añadir más campos si los necesitas
        ];
    }
}
