<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Shipment extends Model
{
    protected $fillable = [
        'tracking_number',
        'address',
        'carrier',
        'carrier_ref',
        'status',
        'cost_minor',
        'currency',
        'estimated_delivery',
        'delivered_at',
        'tracking_events',
    ];

    protected $casts = [
        'address' => 'array',
        'tracking_events' => 'array',
        'cost_minor' => 'integer',
        'estimated_delivery' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // Constantes de estado
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED = 'failed';

    public function order(): HasOne
    {
        return $this->hasOne(Order::class);
    }

    // Helper para formatear costo
    public function getCostAttribute(): float
    {
        return $this->cost_minor / 100;
    }

    // Verificar si está entregado
    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }
}
