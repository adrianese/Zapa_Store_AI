<?php

namespace Tests\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Auction;

class AuctionAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_auction_with_products()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $products = Product::factory()->count(2)->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/auctions', [
            'product_ids' => $products->pluck('id')->toArray(),
            'start_at' => now()->addHour()->toDateTimeString(),
            'end_at' => now()->addDays(2)->toDateTimeString(),
            'starting_bid_minor' => 50000,
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('auctions', ['starting_bid_minor' => 50000]);
    }

    public function test_admin_can_pause_and_resume_auction()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $auction = Auction::factory()->create(['status' => 'active']);
        $this->actingAs($admin, 'sanctum');

        $pause = $this->postJson('/api/auctions/' . $auction->id . '/pause');
        $pause->assertStatus(200);
        $this->assertEquals('paused', $auction->fresh()->status);

        $resume = $this->postJson('/api/auctions/' . $auction->id . '/resume');
        $resume->assertStatus(200);
        $this->assertEquals('active', $auction->fresh()->status);
    }
}
