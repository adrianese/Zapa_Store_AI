<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeder de roles y permisos primero (si no existen)
        try {
            $this->call(RoleAndPermissionSeeder::class);
        } catch (\Exception $e) {
            // Ya existen, continuar
        }

        // Crear usuario admin de ejemplo
        $admin = User::updateOrCreate(
            ['email' => 'admin@correo.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('admin123'),
                'is_admin' => true,
            ]
        );
        $admin->assignRole('admin');

        // Crear usuario cliente de ejemplo
        $user = User::factory()->create([
            'name' => 'Jupe',
            'email' => 'jupe@correo.com',
            'password' => bcrypt('12345678'),
            'is_admin' => false,
        ]);
        $user->assignRole('user');

        // Cargar productos, listings y órdenes de prueba
        $this->call([
            ProductSeeder::class,
            ListingSeeder::class,
            OrderSeeder::class,
            BrandDetailSeeder::class,
        ]);
    }
}
