<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'min_purchase',
        'max_discount',
        'usage_limit',
        'usage_limit_per_user',
        'times_used',
        'starts_at',
        'expires_at',
        'is_active',
        'applicable_categories',
        'applicable_brands',
        'created_by',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_purchase' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_limit_per_user' => 'integer',
        'times_used' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'applicable_categories' => 'array',
        'applicable_brands' => 'array',
    ];

    /**
     * Usuario que creó el cupón
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Usuarios que han usado el cupón
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'coupon_user')
            ->withPivot(['order_id', 'discount_applied', 'used_at'])
            ->withTimestamps();
    }

    /**
     * Verificar si el cupón está disponible
     */
    public function isAvailable(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Verificar fechas
        $now = now();
        if ($this->starts_at && $now < $this->starts_at) {
            return false;
        }
        if ($this->expires_at && $now > $this->expires_at) {
            return false;
        }

        // Verificar límite de usos
        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Verificar si un usuario puede usar el cupón
     */
    public function canBeUsedBy(User $user): array
    {
        if (!$this->isAvailable()) {
            return ['valid' => false, 'message' => 'Este cupón no está disponible'];
        }

        // Verificar usos por usuario
        $userUsageCount = $this->users()->where('user_id', $user->id)->count();
        if ($userUsageCount >= $this->usage_limit_per_user) {
            return ['valid' => false, 'message' => 'Ya has usado este cupón el máximo de veces permitido'];
        }

        return ['valid' => true, 'message' => 'Cupón válido'];
    }

    /**
     * Calcular el descuento para un monto dado
     */
    public function calculateDiscount(float $subtotal, array $items = []): array
    {
        // Verificar compra mínima
        if ($this->min_purchase && $subtotal < $this->min_purchase) {
            return [
                'valid' => false,
                'message' => "Compra mínima requerida: $" . number_format($this->min_purchase, 2),
                'discount' => 0,
            ];
        }

        // Filtrar items por categorías/marcas aplicables si está configurado
        $applicableSubtotal = $subtotal;
        if ($this->applicable_categories || $this->applicable_brands) {
            $applicableSubtotal = $this->calculateApplicableSubtotal($items);
            if ($applicableSubtotal <= 0) {
                return [
                    'valid' => false,
                    'message' => 'Este cupón no aplica a los productos en tu carrito',
                    'discount' => 0,
                ];
            }
        }

        // Calcular descuento
        $discount = 0;
        if ($this->type === 'percentage') {
            $discount = $applicableSubtotal * ($this->value / 100);
            // Aplicar límite máximo si existe
            if ($this->max_discount && $discount > $this->max_discount) {
                $discount = $this->max_discount;
            }
        } else {
            // Descuento fijo
            $discount = min($this->value, $applicableSubtotal);
        }

        return [
            'valid' => true,
            'message' => 'Cupón aplicado correctamente',
            'discount' => round($discount, 2),
            'type' => $this->type,
            'value' => $this->value,
        ];
    }

    /**
     * Calcular subtotal de items aplicables
     */
    private function calculateApplicableSubtotal(array $items): float
    {
        $total = 0;

        foreach ($items as $item) {
            $applies = true;

            // Verificar categoría
            if ($this->applicable_categories && !empty($this->applicable_categories)) {
                $itemCategory = $item['category'] ?? null;
                if (!$itemCategory || !in_array($itemCategory, $this->applicable_categories)) {
                    $applies = false;
                }
            }

            // Verificar marca
            if ($applies && $this->applicable_brands && !empty($this->applicable_brands)) {
                $itemBrand = $item['brand'] ?? null;
                if (!$itemBrand || !in_array($itemBrand, $this->applicable_brands)) {
                    $applies = false;
                }
            }

            if ($applies) {
                $price = $item['price_minor'] ?? $item['price'] ?? 0;
                $quantity = $item['quantity'] ?? 1;
                // Si es price_minor, convertir a decimal
                if (isset($item['price_minor'])) {
                    $price = $price / 100;
                }
                $total += $price * $quantity;
            }
        }

        return $total;
    }

    /**
     * Registrar uso del cupón
     */
    public function recordUsage(User $user, float $discountApplied, ?int $orderId = null): void
    {
        $this->users()->attach($user->id, [
            'order_id' => $orderId,
            'discount_applied' => $discountApplied,
            'used_at' => now(),
        ]);

        $this->increment('times_used');
    }

    /**
     * Scope para cupones activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope para cupones disponibles (con usos restantes)
     */
    public function scopeAvailable($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('usage_limit')
                    ->orWhereRaw('times_used < usage_limit');
            });
    }

    /**
     * Obtener estado formateado
     */
    public function getStatusAttribute(): string
    {
        if (!$this->is_active) return 'Inactivo';

        $now = now();
        if ($this->starts_at && $now < $this->starts_at) return 'Programado';
        if ($this->expires_at && $now > $this->expires_at) return 'Expirado';
        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) return 'Agotado';

        return 'Activo';
    }
}
