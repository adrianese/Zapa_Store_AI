<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuctionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_all_auctions()
    {
        Auction::factory()->count(3)->create();

        $response = $this->getJson('/api/auctions');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    public function test_can_create_an_auction()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $auctionData = [
            'product_id' => $product->id,
            'start_at' => now()->addDay()->toIso8601String(),
            'end_at' => now()->addDays(2)->toIso8601String(),
            'starting_bid_minor' => 10000,
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/auctions', $auctionData);

        $response->assertStatus(201)
            ->assertJsonFragment(['product_id' => $product->id]);

        $this->assertDatabaseHas('auctions', ['product_id' => $product->id]);
    }

    public function test_can_get_a_single_auction()
    {
        $auction = Auction::factory()->create();

        $response = $this->getJson('/api/auctions/' . $auction->id);

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $auction->id]);
    }

    public function test_can_update_an_auction()
    {
        $user = User::factory()->create();
        $auction = Auction::factory()->create();
        $updateData = ['status' => 'active'];

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/auctions/' . $auction->id, $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment($updateData);

        $this->assertDatabaseHas('auctions', $updateData);
    }

    public function test_can_delete_an_auction()
    {
        $user = User::factory()->create();
        $auction = Auction::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson('/api/auctions/' . $auction->id);

        $response->assertStatus(204);

        $this->assertSoftDeleted('auctions', ['id' => $auction->id]);
    }
}
