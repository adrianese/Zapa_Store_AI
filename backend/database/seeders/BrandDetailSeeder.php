<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BrandDetail;

class BrandDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Leer el archivo detalles.json desde frontend/public
        $jsonPath = base_path('../frontend/public/detalles.json');
        if (!file_exists($jsonPath)) {
            $this->command->error('Archivo detalles.json no encontrado en ' . $jsonPath);
            return;
        }

        $jsonContent = file_get_contents($jsonPath);
        $data = json_decode($jsonContent, true);

        if (!$data || !isset($data['productos_deportivos'])) {
            $this->command->error('Estructura del JSON inválida');
            return;
        }

        foreach ($data['productos_deportivos'] as $brand) {
            BrandDetail::updateOrCreate(
                ['marca' => $brand['marca']],
                [
                    'actividad_apta' => $brand['actividad_apta'] ?? [],
                    'beneficios_materiales' => $brand['beneficios_materiales'] ?? [],
                    'descripcion_detallada' => null, // Opcional, puedes agregar si hay más datos
                    'logo_url' => null,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Detalles de marcas cargados desde detalles.json');
    }
}
