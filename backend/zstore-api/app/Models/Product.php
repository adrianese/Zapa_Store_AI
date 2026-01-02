<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'attributes',
        'available', // Añadido para permitir la asignación masiva
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
        'price_minor' => 'integer',
        'available' => 'boolean', // Asegurarse de que 'available' se castee a booleano
    ];

    /**
     * Get the sizes for the product.
     */
    public function sizes(): HasMany
    {
        return $this->hasMany(ProductSize::class);
    }

    /**
     * Determine if the product is available.
     *
     * @return bool
     */
    public function getAvailableAttribute(): bool
    {
        // The product is available if any of its size variants has stock.
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
