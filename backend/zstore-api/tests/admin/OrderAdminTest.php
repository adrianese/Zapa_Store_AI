<?php

namespace Tests\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;

class OrderAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_orders()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Order::factory()->count(3)->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->getJson('/api/orders');
        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
    }

    public function test_admin_can_update_order_status()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $order = Order::factory()->create(['status' => 'pending']);
        $this->actingAs($admin, 'sanctum');

        $response = $this->putJson('/api/orders/' . $order->id, [
            'status' => 'shipped',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('shipped', $order->fresh()->status);
    }
}
