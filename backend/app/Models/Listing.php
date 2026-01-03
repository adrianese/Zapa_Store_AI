<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Listing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'marketplace_item_id',
        'status',
        'transaction_hash',
        'price_minor',
        'currency',
    ];

    /**
     * Get the user (seller) that owns the listing.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product associated with the listing.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
