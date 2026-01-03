<?php

namespace Tests\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;

class ProductAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_product()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/products', [
            'brand' => 'Nike',
            'name' => 'Air Max',
            'price_minor' => 100000,
            'currency' => 'ARS',
            'sizes' => [
                ['size' => '42', 'stock' => 10],
                ['size' => '43', 'stock' => 5],
            ],
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('products', ['name' => 'Air Max']);
    }

    public function test_admin_can_edit_product()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $product = Product::factory()->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->putJson('/api/products/' . $product->id, [
            'name' => 'Air Max Updated',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('products', ['name' => 'Air Max Updated']);
    }

    public function test_admin_can_delete_product()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $product = Product::factory()->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->deleteJson('/api/products/' . $product->id);
        $response->assertStatus(204);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
