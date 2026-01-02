<?php

namespace Tests\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class UserAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        User::factory()->count(5)->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->getJson('/api/users');
        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
    }

    public function test_admin_can_assign_role()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/users/' . $user->id . '/role', [
            'role' => 'seller',
        ]);
        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasRole('seller'));
    }
}
