<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'brand',
        'name',
        'description',
        'price_minor',
        'currency',
        'images',
        'is_featured',
        'in_auction',
        'attributes',
        'available',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'images' => 'array',
        'attributes' => 'object',
        'is_featured' => 'boolean',
        'in_auction' => 'boolean',
        'price_minor' => 'integer',
        'available' => 'boolean',
    ];

    /**
     * Get the sizes for the product.
     */
    public function sizes(): HasMany
    {
        return $this->hasMany(ProductSize::class);
    }

    /**
     * Get the auctions this product belongs to.
     */
    public function auctions(): BelongsToMany
    {
        return $this->belongsToMany(Auction::class, 'auction_product');
    }

    /**
     * Mark product as in auction.
     */
    public function markInAuction(): void
    {
        $this->update(['in_auction' => true]);
    }

    /**
     * Mark product as not in auction.
     */
    public function markNotInAuction(): void
    {
        $this->update(['in_auction' => false]);
    }

    /**
     * Determine if the product is available.
     *
     * @return bool
     */
    public function getAvailableAttribute(): bool
    {
        return $this->sizes()->where('stock', '>', 0)->exists();
    }

    /**
     * Recalculate and update the product's availability based on stock.
     */
    public function updateAvailability()
    {
        $this->available = $this->sizes()->where('stock', '>', 0)->exists();
        $this->save();
    }
}
