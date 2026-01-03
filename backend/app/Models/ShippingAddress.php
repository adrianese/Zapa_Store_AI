<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'recipient_name',
        'phone',
        'street',
        'apartment',
        'city',
        'province',
        'postal_code',
        'country',
        'instructions',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Relación con el usuario
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Órdenes que usan esta dirección
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Convertir a array para snapshot
     */
    public function toSnapshot(): array
    {
        return [
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'street' => $this->street,
            'apartment' => $this->apartment,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'instructions' => $this->instructions,
        ];
    }

    /**
     * Dirección formateada como string
     */
    public function getFullAddressAttribute(): string
    {
        $parts = [$this->street];

        if ($this->apartment) {
            $parts[] = $this->apartment;
        }

        $parts[] = "{$this->city}, {$this->province}";
        $parts[] = "CP {$this->postal_code}";
        $parts[] = $this->country;

        return implode(', ', $parts);
    }

    /**
     * Establecer como dirección por defecto
     */
    public function setAsDefault(): void
    {
        // Quitar default de otras direcciones del usuario
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }
}
