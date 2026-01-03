<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ShipmentController extends Controller
{
    /**
     * Obtener cotización de envío
     */
    public function quote(Request $request)
    {
        $validated = $request->validate([
            'postal_code' => 'required|string|max:20',
            'province' => 'required|string|max:100',
            'weight_kg' => 'sometimes|numeric|min:0.1|max:30',
            'items_count' => 'sometimes|integer|min:1',
        ]);

        // Cache por 15 minutos como indica el roadmap
        $cacheKey = "shipping_quote_{$validated['postal_code']}_{$validated['province']}";

        $quote = Cache::remember($cacheKey, 900, function () use ($validated) {
            return $this->calculateQuote($validated);
        });

        return response()->json($quote);
    }

    /**
     * Obtener tracking de un envío
     */
    public function track(Request $request, $trackingNumber)
    {
        $shipment = Shipment::where('tracking_number', $trackingNumber)->firstOrFail();

        // TODO: Integrar con API del carrier para obtener eventos actualizados
        // Por ahora retornamos los eventos guardados
        return response()->json([
            'tracking_number' => $shipment->tracking_number,
            'carrier' => $shipment->carrier,
            'status' => $shipment->status,
            'estimated_delivery' => $shipment->estimated_delivery,
            'delivered_at' => $shipment->delivered_at,
            'events' => $shipment->tracking_events ?? [],
            'address' => $shipment->address,
        ]);
    }

    /**
     * Mostrar detalle de un shipment
     */
    public function show($id)
    {
        $shipment = Shipment::findOrFail($id);
        return response()->json($shipment);
    }

    /**
     * Actualizar estado de envío (webhook de carrier o admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,in_transit,delivered,failed',
            'tracking_number' => 'sometimes|string|max:100',
            'carrier' => 'sometimes|string|max:50',
            'carrier_ref' => 'sometimes|string|max:100',
            'event' => 'sometimes|array',
            'event.description' => 'required_with:event|string',
            'event.location' => 'sometimes|string',
            'event.timestamp' => 'sometimes|date',
        ]);

        // Actualizar campos básicos
        $shipment->fill([
            'status' => $validated['status'],
            'tracking_number' => $validated['tracking_number'] ?? $shipment->tracking_number,
            'carrier' => $validated['carrier'] ?? $shipment->carrier,
            'carrier_ref' => $validated['carrier_ref'] ?? $shipment->carrier_ref,
        ]);

        // Agregar evento de tracking si viene
        if (isset($validated['event'])) {
            $events = $shipment->tracking_events ?? [];
            $events[] = [
                'description' => $validated['event']['description'],
                'location' => $validated['event']['location'] ?? null,
                'timestamp' => $validated['event']['timestamp'] ?? now()->toIso8601String(),
            ];
            $shipment->tracking_events = $events;
        }

        // Marcar como entregado si corresponde
        if ($validated['status'] === 'delivered' && !$shipment->delivered_at) {
            $shipment->delivered_at = now();
        }

        $shipment->save();

        return response()->json([
            'message' => 'Envío actualizado',
            'shipment' => $shipment,
        ]);
    }

    /**
     * Calcular cotización de envío
     */
    private function calculateQuote(array $params): array
    {
        $postalCode = $params['postal_code'];
        $province = $params['province'];
        $weight = $params['weight_kg'] ?? 1;
        $itemsCount = $params['items_count'] ?? 1;

        // Zonas y tarifas base (en centavos ARS)
        $zoneRates = [
            'CABA' => ['standard' => 100000, 'express' => 180000],
            'Buenos Aires' => ['standard' => 150000, 'express' => 250000],
            'Córdoba' => ['standard' => 200000, 'express' => 350000],
            'Santa Fe' => ['standard' => 180000, 'express' => 320000],
            'Mendoza' => ['standard' => 250000, 'express' => 400000],
            'Tucumán' => ['standard' => 280000, 'express' => 450000],
        ];

        $baseRates = $zoneRates[$province] ?? ['standard' => 200000, 'express' => 380000];

        // Ajustar por peso (adicional por kg extra después del primero)
        $extraWeightCharge = max(0, ($weight - 1)) * 20000; // $200 por kg extra

        // Calcular días estimados
        $standardDays = $this->getEstimatedDays($province, 'standard');
        $expressDays = $this->getEstimatedDays($province, 'express');

        return [
            'postal_code' => $postalCode,
            'province' => $province,
            'currency' => 'ARS',
            'options' => [
                [
                    'carrier' => 'Andreani',
                    'service' => 'standard',
                    'name' => 'Envío Estándar',
                    'price_minor' => $baseRates['standard'] + $extraWeightCharge,
                    'estimated_days' => $standardDays,
                    'estimated_delivery' => now()->addWeekdays($standardDays)->format('Y-m-d'),
                ],
                [
                    'carrier' => 'OCA',
                    'service' => 'standard',
                    'name' => 'OCA Estándar',
                    'price_minor' => (int)($baseRates['standard'] * 0.95) + $extraWeightCharge,
                    'estimated_days' => $standardDays + 1,
                    'estimated_delivery' => now()->addWeekdays($standardDays + 1)->format('Y-m-d'),
                ],
                [
                    'carrier' => 'Andreani',
                    'service' => 'express',
                    'name' => 'Envío Express',
                    'price_minor' => $baseRates['express'] + $extraWeightCharge,
                    'estimated_days' => $expressDays,
                    'estimated_delivery' => now()->addWeekdays($expressDays)->format('Y-m-d'),
                ],
            ],
            'cached_until' => now()->addMinutes(15)->toIso8601String(),
        ];
    }

    /**
     * Obtener días estimados según provincia y servicio
     */
    private function getEstimatedDays(string $province, string $service): int
    {
        $days = [
            'CABA' => ['standard' => 2, 'express' => 1],
            'Buenos Aires' => ['standard' => 3, 'express' => 1],
            'Córdoba' => ['standard' => 5, 'express' => 2],
            'Santa Fe' => ['standard' => 4, 'express' => 2],
            'Mendoza' => ['standard' => 6, 'express' => 3],
        ];

        return $days[$province][$service] ?? ($service === 'express' ? 3 : 7);
    }
}
