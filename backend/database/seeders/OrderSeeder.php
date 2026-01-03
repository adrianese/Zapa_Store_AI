<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios y productos existentes
        $users = DB::table('users')->where('is_admin', false)->pluck('id')->toArray();
        $products = DB::table('products')->get();

        if (empty($users)) {
            $this->command->warn('⚠ No hay usuarios no-admin. Creando usuarios de prueba...');
            $users = $this->createTestUsers();
        }

        if ($products->isEmpty()) {
            $this->command->warn('⚠ No hay productos. Ejecute ProductSeeder primero.');
            return;
        }

        $statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        $ordersToCreate = 25;

        for ($i = 0; $i < $ordersToCreate; $i++) {
            $userId = $users[array_rand($users)];
            $user = DB::table('users')->find($userId);

            // Seleccionar 1-3 productos aleatorios
            $numItems = rand(1, 3);
            $selectedProducts = $products->random($numItems);

            $items = [];
            $subtotal = 0;

            foreach ($selectedProducts as $product) {
                $quantity = rand(1, 2);
                $lineTotal = $product->price_minor * $quantity;
                $subtotal += $lineTotal;

                $items[] = [
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'size' => (string) rand(38, 44),
                    'quantity' => $quantity,
                    'price_minor' => $product->price_minor,
                    'line_total_minor' => $lineTotal,
                ];
            }

            // Calcular totales
            $taxMinor = (int) round($subtotal * 0.21);
            $shippingMinor = rand(100000, 250000);
            $totalMinor = $subtotal + $taxMinor + $shippingMinor;

            // Estado aleatorio (más pedidos completados que pendientes)
            $status = $statuses[array_rand($statuses)];

            // Fecha aleatoria en los últimos 6 meses
            $createdAt = Carbon::now()->subDays(rand(0, 180))->subHours(rand(0, 23));

            // Crear shipment
            $shipmentId = DB::table('shipments')->insertGetId([
                'address' => json_encode([
                    'street' => 'Calle Ejemplo ' . rand(100, 9999),
                    'city' => ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'][rand(0, 4)],
                    'province' => ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza'][rand(0, 4)],
                    'postal_code' => (string) rand(1000, 9999),
                    'country' => 'Argentina',
                    'phone' => '11' . rand(10000000, 99999999),
                    'full_name' => $user->name,
                ]),
                'status' => $status === 'shipped' || $status === 'delivered' ? 'shipped' : 'pending',
                'cost_minor' => $shippingMinor,
                'currency' => 'ARS',
                'tracking_number' => $status === 'shipped' || $status === 'delivered' ? 'ZS' . strtoupper(Str::random(10)) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // Crear orden
            DB::table('orders')->insert([
                'order_number' => 'ZS-' . $createdAt->format('ymd') . '-' . strtoupper(Str::random(4)),
                'buyer_id' => $userId,
                'items' => json_encode($items),
                'subtotal_minor' => $subtotal,
                'tax_minor' => $taxMinor,
                'shipping_minor' => $shippingMinor,
                'total_minor' => $totalMinor,
                'currency' => 'ARS',
                'status' => $status,
                'shipment_id' => $shipmentId,
                'notes' => rand(0, 3) === 0 ? 'Nota de prueba para el pedido' : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $this->command->info("✓ {$ordersToCreate} órdenes de prueba creadas exitosamente");
    }

    /**
     * Crear usuarios de prueba si no existen
     */
    private function createTestUsers(): array
    {
        $testUsers = [
            ['name' => 'María García', 'email' => 'maria@test.com'],
            ['name' => 'Juan Pérez', 'email' => 'juan@test.com'],
            ['name' => 'Ana López', 'email' => 'ana@test.com'],
            ['name' => 'Carlos Rodríguez', 'email' => 'carlos@test.com'],
            ['name' => 'Laura Fernández', 'email' => 'laura@test.com'],
        ];

        $userIds = [];
        foreach ($testUsers as $user) {
            $userIds[] = DB::table('users')->insertGetId([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => bcrypt('password123'),
                'is_admin' => false,
                'email_verified_at' => now(),
                'created_at' => now()->subDays(rand(30, 180)),
                'updated_at' => now(),
            ]);
        }

        return $userIds;
    }
}
