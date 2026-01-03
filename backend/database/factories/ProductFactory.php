<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'sku' => $this->faker->unique()->ean8(),
            'name' => $this->faker->words(3, true),
            'brand' => $this->faker->company(),
            'model' => $this->faker->word(),
            'colorway' => $this->faker->colorName(),
            'price_minor' => $this->faker->numberBetween(10000, 50000),
            'currency' => 'ARS',
            'stock' => $this->faker->numberBetween(0, 100),
            'images' => [
                $this->faker->imageUrl(),
                $this->faker->imageUrl(),
            ],
            'description' => $this->faker->paragraph(),
            'available' => true,
            'is_featured' => false,
        ];
    }
}
