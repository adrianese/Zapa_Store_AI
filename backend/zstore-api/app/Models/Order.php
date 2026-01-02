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
        'shipment_id',
        'notes',
    ];

    protected $casts = [
        'items' => 'array',
    ];

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
        // Assuming a Payment model exists
        return $this->belongsTo(Payment::class);
    }

    public function shipment(): BelongsTo
    {
        // Assuming a Shipment model exists
        return $this->belongsTo(Shipment::class);
    }
}