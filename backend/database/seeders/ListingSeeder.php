<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Listing;
use App\Models\User;

class ListingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Elimina todos los listings existentes sin truncar (respeta claves foráneas)
        Listing::query()->delete();

        // Busca un usuario admin para asociar los listings
        $admin = User::where('is_admin', true)->first();
        if (!$admin) {
            $admin = User::first(); // fallback: primer usuario
        }

        // Crea un listing para cada producto disponible
        $products = Product::all();
        foreach ($products as $product) {
            Listing::create([
                'user_id' => $admin->id,
                'product_id' => $product->id,
                'status' => 'active',
                'price_minor' => $product->price_minor,
                'currency' => $product->currency ?? 'ARS',
            ]);
        }
    }
}
