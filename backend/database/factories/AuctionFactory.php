<?php

namespace Database\Factories;

use App\Models\Auction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuctionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Auction::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'product_id' => Product::factory(),
            'start_at' => now()->addHours(1),
            'end_at' => now()->addDays(1),
            'reserve_price_minor' => $this->faker->numberBetween(5000, 10000),
            'starting_bid_minor' => $this->faker->numberBetween(1000, 5000),
            'current_bid_minor' => null,
            'winner_id' => null,
            'status' => 'pending',
        ];
    }
}
