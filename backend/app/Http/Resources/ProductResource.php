<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'brand' => $this->brand,
            'name' => $this->name,
            'description' => $this->description,
            'price_minor' => $this->price_minor,
            'currency' => $this->currency,
            'images' => $this->images,
            'is_featured' => $this->is_featured,
            'in_auction' => $this->in_auction,
            'attributes' => $this->attributes,

            // Add the dynamically calculated 'available' attribute
            'available' => $this->available,

            // Load and format the 'sizes' relationship
            'sizes' => ProductSizeResource::collection($this->whenLoaded('sizes')),
        ];
    }
}
