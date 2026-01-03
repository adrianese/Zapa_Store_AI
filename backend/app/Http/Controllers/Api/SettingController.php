<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SettingController extends Controller
{
    /**
     * Obtener todas las configuraciones (admin)
     */
    public function index()
    {
        Gate::authorize('admin');

        $settings = Setting::all()->groupBy('group')->map(function ($group) {
            return $group->mapWithKeys(function ($setting) {
                return [$setting->key => [
                    'value' => $this->castValue($setting->value, $setting->type),
                    'type' => $setting->type,
                    'label' => $setting->label,
                    'description' => $setting->description,
                ]];
            });
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Obtener configuraciones públicas (para frontend)
     */
    public function publicSettings()
    {
        $publicKeys = [
            'store_name',
            'store_email',
            'store_phone',
            'currency',
            'shipping_enabled',
            'free_shipping_threshold',
            'enable_auctions',
            'enable_blockchain',
            'maintenance_mode',
        ];

        $settings = Setting::whereIn('key', $publicKeys)->get();

        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->key] = $this->castValue($setting->value, $setting->type);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Actualizar múltiples configuraciones
     */
    public function update(Request $request)
    {
        Gate::authorize('admin');

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'present',
            'settings.*.type' => 'sometimes|string|in:string,boolean,integer,float,json',
            'settings.*.group' => 'sometimes|string',
            'settings.*.label' => 'sometimes|string',
            'settings.*.description' => 'sometimes|string|nullable',
        ]);

        $updated = [];

        foreach ($validated['settings'] as $item) {
            $value = $item['value'];

            // Convertir valor para almacenamiento
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            } elseif (is_array($value)) {
                $value = json_encode($value);
            }

            $setting = Setting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => (string) $value,
                    'type' => $item['type'] ?? 'string',
                    'group' => $item['group'] ?? 'general',
                    'label' => $item['label'] ?? null,
                    'description' => $item['description'] ?? null,
                ]
            );

            $updated[] = $setting->key;
        }

        // Limpiar caché
        Setting::clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Configuraciones actualizadas',
            'updated' => $updated,
        ]);
    }

    /**
     * Actualizar una configuración individual
     */
    public function updateSingle(Request $request, string $key)
    {
        Gate::authorize('admin');

        $validated = $request->validate([
            'value' => 'present',
            'type' => 'sometimes|string|in:string,boolean,integer,float,json',
            'group' => 'sometimes|string',
            'label' => 'sometimes|string',
            'description' => 'sometimes|string|nullable',
        ]);

        $value = $validated['value'];

        if (is_bool($value)) {
            $value = $value ? '1' : '0';
        } elseif (is_array($value)) {
            $value = json_encode($value);
        }

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => (string) $value,
                'type' => $validated['type'] ?? 'string',
                'group' => $validated['group'] ?? 'general',
                'label' => $validated['label'] ?? null,
                'description' => $validated['description'] ?? null,
            ]
        );

        Setting::clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Configuración actualizada',
            'setting' => $setting,
        ]);
    }

    /**
     * Restaurar configuraciones por defecto
     */
    public function reset()
    {
        Gate::authorize('admin');

        // Eliminar todas las configuraciones
        Setting::truncate();
        Setting::clearCache();

        // Ejecutar seeder para valores por defecto
        \Artisan::call('db:seed', ['--class' => 'SettingsSeeder', '--force' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Configuraciones restauradas a valores por defecto',
        ]);
    }

    /**
     * Convertir valor según tipo
     */
    private function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'float' => (float) $value,
            'json', 'array' => json_decode($value, true),
            default => $value,
        };
    }
}
