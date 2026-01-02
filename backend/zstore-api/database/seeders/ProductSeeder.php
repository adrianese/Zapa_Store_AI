<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            ['brand' => 'Niko', 'model' => 'NI-2094', 'image' => 'NI-2094.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 86500],
            ['brand' => 'Niko', 'model' => 'NI-5682', 'image' => 'NI-5682.jpg', 'activity' => 'running', 'available' => false, 'price' => 59500],
            ['brand' => 'Adedos', 'model' => 'AD-3140', 'image' => 'AD-3140.jpg', 'activity' => 'walking', 'available' => true, 'price' => 110500],
            ['brand' => 'Under A', 'model' => 'UN-1903', 'image' => 'UN-1903.jpg', 'activity' => 'running', 'available' => true, 'price' => 98000],
            ['brand' => 'Niko', 'model' => 'NI-0983', 'image' => 'NI-0983.jpg', 'activity' => 'running', 'available' => true, 'price' => 85500],
            ['brand' => 'Adedos', 'model' => 'AD-6254', 'image' => 'AD-6254.jpg', 'activity' => 'walking', 'available' => true, 'price' => 58000],
            ['brand' => 'Under A', 'model' => 'UN-1840', 'image' => 'UN-1840.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 105000],
            ['brand' => 'Niko', 'model' => 'NI-6020', 'image' => 'NI-6020.jpg', 'activity' => 'walking', 'available' => true, 'price' => 99500],
            ['brand' => 'Niko', 'model' => 'NI-3121', 'image' => 'NI-3121.jpg', 'activity' => 'running', 'available' => true, 'price' => 63500],
            ['brand' => 'Adedos', 'model' => 'AD-4577', 'image' => 'AD-4577.jpg', 'activity' => 'walking', 'available' => false, 'price' => 109000],
            ['brand' => 'Under A', 'model' => 'UN-0512', 'image' => 'UN-0512.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 56000],
            ['brand' => 'Under A', 'model' => 'UN-3105', 'image' => 'UN-3105.jpg', 'activity' => 'walking', 'available' => true, 'price' => 111000],
            ['brand' => 'Niko', 'model' => 'NI-4206', 'image' => 'NI-4206.jpg', 'activity' => 'running', 'available' => true, 'price' => 80500],
            ['brand' => 'Adedos', 'model' => 'AD-1689', 'image' => 'AD-1689.jpg', 'activity' => 'walking', 'available' => true, 'price' => 69000],
            ['brand' => 'Under A', 'model' => 'UN-2671', 'image' => 'UN-2671.jpg', 'activity' => 'walking', 'available' => true, 'price' => 111500],
            ['brand' => 'Niko', 'model' => 'NI-9812', 'image' => 'NI-9812.jpg', 'activity' => 'running', 'available' => true, 'price' => 87000],
            ['brand' => 'Niko', 'model' => 'NI-0058', 'image' => 'NI-0058.jpg', 'activity' => 'walking', 'available' => true, 'price' => 92500],
            ['brand' => 'Adedos', 'model' => 'AD-6013', 'image' => 'AD-6013.jpg', 'activity' => 'walking', 'available' => true, 'price' => 102000],
            ['brand' => 'Under A', 'model' => 'UN-7594', 'image' => 'UN-7594.jpg', 'activity' => 'trekking', 'available' => false, 'price' => 73500],
            ['brand' => 'Adedos', 'model' => 'AD-6720', 'image' => 'AD-6720.jpg', 'activity' => 'running', 'available' => true, 'price' => 99500],
            ['brand' => 'Niko', 'model' => 'NI-3469', 'image' => 'NI-3469.jpg', 'activity' => 'walking', 'available' => true, 'price' => 70500],
            ['brand' => 'Adedos', 'model' => 'AD-2241', 'image' => 'AD-2241.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 66000],
            ['brand' => 'Adedos', 'model' => 'AD-7890', 'image' => 'AD-7890.jpg', 'activity' => 'running', 'available' => true, 'price' => 97500],
            ['brand' => 'Niko', 'model' => 'NI-6228', 'image' => 'NI-6228.jpg', 'activity' => 'running', 'available' => true, 'price' => 99500],
            ['brand' => 'TorPe', 'model' => 'TO-4821', 'image' => 'TO-4821.jpg', 'activity' => 'walking', 'available' => true, 'price' => 68900],
            ['brand' => 'TorPe', 'model' => 'TO-9134', 'image' => 'TO-9134.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 73200],
            ['brand' => 'TorPe', 'model' => 'TO-1578', 'image' => 'TO-1578.jpg', 'activity' => 'running', 'available' => true, 'price' => 81000],
            ['brand' => 'TorPe', 'model' => 'TO-6042', 'image' => 'TO-6042.jpg', 'activity' => 'walking', 'available' => true, 'price' => 67500],
            ['brand' => 'TorPe', 'model' => 'TO-2897', 'image' => 'TO-2897.jpg', 'activity' => 'trekking', 'available' => true, 'price' => 74500],
            ['brand' => 'TorPe', 'model' => 'TO-7310', 'image' => 'TO-7310.jpg', 'activity' => 'running', 'available' => true, 'price' => 82000],
        ];

        foreach ($products as $index => $product) {
            $productId = DB::table('products')->insertGetId([
                'sku' => $product['model'],
                'name' => $product['model'],
                'brand' => $product['brand'],
                'model' => $product['model'],
                'price_minor' => $product['price'],
                'currency' => 'ARS',
                'stock' => $product['available'] ? rand(5, 20) : 0,
                'images' => json_encode(["/uploads/productos/{$product['image']}"]),
                'attributes' => json_encode([
                    'activity' => $product['activity'],
                    'gender' => 'unisex',
                ]),
                'description' => "Zapatillas {$product['brand']} modelo {$product['model']} ideales para {$product['activity']}",
                'available' => $product['available'],
                'is_featured' => in_array($index + 1, [1, 5, 13, 16, 20, 24]), // Algunos destacados
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Crear talles para cada producto disponible
            if ($product['available']) {
                $sizes = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
                foreach ($sizes as $size) {
                    DB::table('product_sizes')->insert([
                        'product_id' => $productId,
                        'size' => $size,
                        'stock' => rand(0, 5),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('✓ 30 productos creados exitosamente con talles');
    }
}

