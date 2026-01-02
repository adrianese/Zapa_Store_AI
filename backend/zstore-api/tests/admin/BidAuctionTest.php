<?php

namespace Tests\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Auction;
use App\Models\Bid;

class BidAuctionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_place_bid_on_active_auction()
    {
        $user = User::factory()->create();
        $auction = Auction::factory()->create(['status' => 'active', 'starting_bid_minor' => 1000]);
        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/bids', [
            'auction_id' => $auction->id,
            'amount_minor' => 1500,
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('bids', [
            'auction_id' => $auction->id,
            'user_id' => $user->id,
            'amount_minor' => 1500,
        ]);
    }

    public function test_bid_must_be_higher_than_current()
    {
        $user = User::factory()->create();
        $auction = Auction::factory()->create(['status' => 'active', 'starting_bid_minor' => 1000, 'current_bid_minor' => 1500]);
        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/bids', [
            'auction_id' => $auction->id,
            'amount_minor' => 1200,
        ]);
        $response->assertStatus(422);
    }
}
