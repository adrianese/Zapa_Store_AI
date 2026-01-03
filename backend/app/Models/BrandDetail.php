<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BrandDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'marca',
        'actividad_apta',
        'beneficios_materiales',
        'descripcion_detallada',
        'logo_url',
        'is_active',
    ];

    protected $casts = [
        'actividad_apta' => 'array',
        'beneficios_materiales' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Scope para marcas activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Buscar por nombre de marca (case insensitive)
     */
    public function scopeByBrand($query, string $brand)
    {
        return $query->whereRaw('LOWER(marca) = ?', [strtolower($brand)]);
    }

    /**
     * Obtener productos de esta marca
     */
    public function products()
    {
        return Product::whereRaw('LOWER(brand) = ?', [strtolower($this->marca)]);
    }
}
