<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General
            [
                'key' => 'store_name',
                'value' => 'ZStore',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Nombre de la Tienda',
                'description' => 'Nombre que se mostrará en la tienda',
            ],
            [
                'key' => 'store_email',
                'value' => 'contacto@zstore.com',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Email de Contacto',
                'description' => 'Email principal de la tienda',
            ],
            [
                'key' => 'store_phone',
                'value' => '+54 11 1234-5678',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Teléfono',
                'description' => 'Teléfono de contacto',
            ],
            [
                'key' => 'currency',
                'value' => 'ARS',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Moneda',
                'description' => 'Código de moneda (ARS, USD, etc)',
            ],
            [
                'key' => 'tax_rate',
                'value' => '21',
                'type' => 'integer',
                'group' => 'general',
                'label' => 'Tasa de IVA (%)',
                'description' => 'Porcentaje de IVA aplicado',
            ],

            // Shipping
            [
                'key' => 'shipping_enabled',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'shipping',
                'label' => 'Envíos Habilitados',
                'description' => 'Habilitar/deshabilitar envíos',
            ],
            [
                'key' => 'free_shipping_threshold',
                'value' => '50000',
                'type' => 'integer',
                'group' => 'shipping',
                'label' => 'Envío Gratis desde ($)',
                'description' => 'Monto mínimo para envío gratuito (en centavos)',
            ],
            [
                'key' => 'default_shipping_cost',
                'value' => '2500',
                'type' => 'integer',
                'group' => 'shipping',
                'label' => 'Costo de Envío Base ($)',
                'description' => 'Costo base de envío (en centavos)',
            ],

            // Features
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'features',
                'label' => 'Modo Mantenimiento',
                'description' => 'Activar modo mantenimiento',
            ],
            [
                'key' => 'allow_registrations',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'label' => 'Permitir Registros',
                'description' => 'Permitir registro de nuevos usuarios',
            ],
            [
                'key' => 'enable_auctions',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'label' => 'Habilitar Subastas',
                'description' => 'Mostrar sección de subastas',
            ],
            [
                'key' => 'enable_blockchain',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'features',
                'label' => 'Habilitar Blockchain',
                'description' => 'Permitir pagos con criptomonedas',
            ],

            // Blockchain
            [
                'key' => 'blockchain_network',
                'value' => 'polygon',
                'type' => 'string',
                'group' => 'blockchain',
                'label' => 'Red Blockchain',
                'description' => 'Red para transacciones (ethereum, polygon, arbitrum)',
            ],
            [
                'key' => 'marketplace_contract',
                'value' => '',
                'type' => 'string',
                'group' => 'blockchain',
                'label' => 'Contrato Marketplace',
                'description' => 'Dirección del contrato Marketplace',
            ],
            [
                'key' => 'platform_fee_percent',
                'value' => '5',
                'type' => 'integer',
                'group' => 'blockchain',
                'label' => 'Comisión Plataforma (%)',
                'description' => 'Porcentaje de comisión en ventas',
            ],
            [
                'key' => 'blockchain_discount_percent',
                'value' => '5',
                'type' => 'integer',
                'group' => 'blockchain',
                'label' => 'Descuento Pago Blockchain (%)',
                'description' => 'Descuento por pagar con criptomonedas',
            ],

            // Payment
            [
                'key' => 'transfer_discount_percent',
                'value' => '10',
                'type' => 'integer',
                'group' => 'payment',
                'label' => 'Descuento Transferencia (%)',
                'description' => 'Descuento por pago con transferencia',
            ],
            [
                'key' => 'payment_methods',
                'value' => '["card","transfer","cash","blockchain"]',
                'type' => 'json',
                'group' => 'payment',
                'label' => 'Métodos de Pago',
                'description' => 'Métodos de pago habilitados',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
