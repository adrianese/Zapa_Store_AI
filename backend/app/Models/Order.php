<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'invoice_number',
        'invoice_date',
        'buyer_id',
        'seller_id',
        'listing_id',
        'items',
        'subtotal_minor',
        'tax_minor',
        'shipping_minor',
        'total_minor',
        'currency',
        'status',
        'payment_id',
        'transaction_hash',
        'payment_method',
        'wallet_address',
        'shipment_id',
        'shipping_address_snapshot',
        'shipping_address_id',
        'tracking_number',
        'tracking_carrier',
        'tracking_url',
        'shipped_at',
        'delivered_at',
        'notes',
    ];

    protected $casts = [
        'items' => 'array',
        'shipping_address_snapshot' => 'array',
        'invoice_date' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // Estados de orden
    const STATUS_PENDING = 'pending';
    const STATUS_AWAITING_PAYMENT = 'awaiting_payment';
    const STATUS_PAID = 'paid';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    // Métodos de pago
    const PAYMENT_TRADITIONAL = 'traditional';
    const PAYMENT_BLOCKCHAIN = 'blockchain';

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(ShippingAddress::class);
    }

    /**
     * Generar número de orden único
     */
    public static function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -5));
        return "{$prefix}-{$date}-{$random}";
    }

    /**
     * Generar número de factura único
     */
    public static function generateInvoiceNumber(): string
    {
        $prefix = 'FAC';
        $year = now()->format('Y');
        $lastInvoice = static::whereYear('invoice_date', $year)
            ->whereNotNull('invoice_number')
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice && preg_match('/FAC-\d{4}-(\d+)/', $lastInvoice->invoice_number, $matches)) {
            $number = (int)$matches[1] + 1;
        } else {
            $number = 1;
        }

        return sprintf('%s-%s-%06d', $prefix, $year, $number);
    }

    /**
     * Marcar como pagado
     */
    public function markAsPaid(?string $transactionHash = null): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'transaction_hash' => $transactionHash,
            'invoice_number' => $this->invoice_number ?? self::generateInvoiceNumber(),
            'invoice_date' => $this->invoice_date ?? now(),
        ]);
    }

    /**
     * Verificar si es pago blockchain
     */
    public function isBlockchainPayment(): bool
    {
        return $this->payment_method === self::PAYMENT_BLOCKCHAIN;
    }

    /**
     * Obtener precio formateado
     */
    public function getFormattedTotalAttribute(): string
    {
        return number_format($this->total_minor / 100, 2, ',', '.');
    }

    /**
     * Agregar tracking al pedido
     */
    public function addTracking(string $trackingNumber, ?string $carrier = null, ?string $url = null): void
    {
        $this->update([
            'tracking_number' => $trackingNumber,
            'tracking_carrier' => $carrier,
            'tracking_url' => $url,
            'status' => self::STATUS_SHIPPED,
            'shipped_at' => now(),
        ]);
    }

    /**
     * Marcar como entregado
     */
    public function markAsDelivered(): void
    {
        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
    }

    /**
     * Obtener URL de tracking formateada
     */
    public function getTrackingUrlAttribute($value): ?string
    {
        if ($value) return $value;

        // URLs de carriers comunes en Argentina
        $carrierUrls = [
            'andreani' => 'https://www.andreani.com/#!/buscarEnvio?tracking=',
            'oca' => 'https://www1.oca.com.ar/OCAWeb/SeguimientoPiezaExpress.aspx?piession=',
            'correo_argentino' => 'https://www.correoargentino.com.ar/seguimiento-de-envios?id=',
            'dhl' => 'https://www.dhl.com/ar-es/home/tracking.html?tracking-id=',
            'fedex' => 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
        ];

        if ($this->tracking_carrier && $this->tracking_number) {
            $carrier = strtolower(str_replace(' ', '_', $this->tracking_carrier));
            if (isset($carrierUrls[$carrier])) {
                return $carrierUrls[$carrier] . $this->tracking_number;
            }
        }

        return null;
    }
}
