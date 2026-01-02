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

        // Crear usuario admin de ejemplo
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@correo.com',
            'password' => bcrypt('12345678'),
            'is_admin' => true,
        ]);

        // Crear usuario cliente de ejemplo
        User::factory()->create([
            'name' => 'Jupe',
            'email' => 'jupe@correo.com',
            'password' => bcrypt('12345678'),
            'is_admin' => false,
        ]);

        // Cargar productos
        $this->call([
            ProductSeeder::class,
            ListingSeeder::class,
        ]);
    }
}
