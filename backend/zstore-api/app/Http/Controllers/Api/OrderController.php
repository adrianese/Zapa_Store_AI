<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\Product;
use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Http\Resources\OrderResource; // Importar el Resource

class OrderController extends Controller
{
    /**
     * Listar todas las órdenes para el panel de admin
     */
    public function adminIndex()
    {
        $orders = Order::with('buyer')->latest()->get();
        return OrderResource::collection($orders);
    }

    /**
     * Listar órdenes del usuario autenticado
     */
    public function index(Request $request)
    {
        $orders = Order::where('buyer_id', $request->user()->id)
            ->with(['listing', 'payment', 'shipment'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    /**
     * Mostrar una orden específica
     */
    public function show(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('buyer_id', $request->user()->id)
            ->with(['payment', 'shipment'])
            ->firstOrFail();

        return response()->json($order);
    }

    /**
     * Crear nueva orden desde el carrito
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.size' => 'required|string',
            'items.*.price_minor' => 'required|integer|min:0',
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.province' => 'required|string|max:100',
            'shipping_address.postal_code' => 'required|string|max:20',
            'shipping_address.country' => 'required|string|max:50',
            'shipping_address.phone' => 'required|string|max:30',
            'shipping_address.full_name' => 'required|string|max:150',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Calcular totales
            $subtotal = 0;
            $itemsWithDetails = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                // Verificar stock (simplificado - podrías verificar por talle)
                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'error' => "Stock insuficiente para {$product->name}"
                    ], 422);
                }

                $lineTotal = $item['price_minor'] * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsWithDetails[] = [
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'size' => $item['size'],
                    'quantity' => $item['quantity'],
                    'price_minor' => $item['price_minor'],
                    'line_total_minor' => $lineTotal,
                ];

                // Reducir stock
                $product->decrement('stock', $item['quantity']);
            }

            // Calcular impuestos (21% IVA ejemplo Argentina)
            $taxRate = 0.21;
            $taxMinor = (int) round($subtotal * $taxRate);

            // Costo de envío (placeholder - integrar con carrier API)
            $shippingMinor = $this->calculateShipping($validated['shipping_address']);

            $totalMinor = $subtotal + $taxMinor + $shippingMinor;

            // Crear shipment
            $shipment = Shipment::create([
                'address' => $validated['shipping_address'],
                'status' => 'pending',
                'cost_minor' => $shippingMinor,
                'currency' => 'ARS',
            ]);

            // Crear orden
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'buyer_id' => $request->user()->id,
                'items' => $itemsWithDetails,
                'subtotal_minor' => $subtotal,
                'tax_minor' => $taxMinor,
                'shipping_minor' => $shippingMinor,
                'total_minor' => $totalMinor,
                'currency' => 'ARS',
                'status' => 'pending',
                'shipment_id' => $shipment->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'message' => 'Orden creada exitosamente',
                'order' => $order->load('shipment'),
            ], 201);
        });
    }

    /**
     * Create a new order from a blockchain transaction.
     */
    public function storeFromBlockchain(Request $request)
    {
        $validated = $request->validate([
            'marketplace_item_id' => 'required|integer|exists:listings,marketplace_item_id',
            'transaction_hash' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $listing = Listing::with('product')->where('marketplace_item_id', $validated['marketplace_item_id'])->firstOrFail();

            if ($listing->status !== 'active') {
                return response()->json(['error' => 'Listing is not active'], 422);
            }

            // Create an order based on the listing details
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'buyer_id' => $request->user()->id,
                'seller_id' => $listing->user_id,
                'listing_id' => $listing->id,
                'items' => [
                    [
                        'product_id' => $listing->product->id,
                        'name' => $listing->product->name,
                        'brand' => $listing->product->brand,
                        'quantity' => 1, // Assuming 1 item per listing
                        'price_minor' => $listing->price_minor,
                    ]
                ],
                'subtotal_minor' => $listing->price_minor,
                'tax_minor' => 0,
                'shipping_minor' => 0, // Shipping handled separately for on-chain
                'total_minor' => $listing->price_minor,
                'currency' => $listing->currency,
                'status' => 'paid_on_chain',
                // 'payment_id' can be linked to a new table storing transaction hashes
            ]);

            // Update the listing status to 'sold'
            $listing->update(['status' => 'sold']);

            return response()->json([
                'message' => 'Order created from blockchain transaction.',
                'order' => $order,
            ], 201);
        });
    }

    /**
     * Actualizar estado de la orden (admin)
     */
    public function adminUpdateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])],
        ]);

        $order->update(['status' => $validated['status']]);

        return new OrderResource($order->fresh('buyer'));
    }


    /**
     * Actualizar estado de la orden (usuario)
     */
    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,paid,processing,shipped,delivered,cancelled',
            'notes' => 'sometimes|nullable|string|max:500',
        ]);

        $order->update($validated);

        return response()->json([
            'message' => 'Orden actualizada',
            'order' => $order->fresh(['payment', 'shipment']),
        ]);
    }

    /**
     * Update the status of a specific order.
     */
    public function updateStatus(Request $request, Order $order)
    {
        if ($request->user()->id !== $order->buyer_id) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['delivered', 'in_dispute', 'cancelled'])],
        ]);

        // Add more logic here to check if the status transition is valid
        // For example, can only move to 'in_dispute' from 'paid_on_chain'

        $order->update(['status' => $validated['status']]);

        return response()->json($order->fresh('listing'));
    }

    /**
     * Cancelar orden (solo si está pendiente)
     */
    public function cancel(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('buyer_id', $request->user()->id)
            ->firstOrFail();

        if (!in_array($order->status, ['pending', 'paid'])) {
            return response()->json([
                'error' => 'No se puede cancelar una orden en estado: ' . $order->status
            ], 422);
        }

        // Restaurar stock
        foreach ($order->items as $item) {
            Product::where('id', $item['product_id'])
                ->increment('stock', $item['quantity']);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Orden cancelada',
            'order' => $order,
        ]);
    }

    /**
     * Generar número de orden único
     */
    private function generateOrderNumber(): string
    {
        $prefix = 'ZS';
        $date = now()->format('ymd');
        $random = strtoupper(Str::random(4));
        return "{$prefix}-{$date}-{$random}";
    }

    /**
     * Calcular costo de envío (placeholder)
     */
    private function calculateShipping(array $address): int
    {
        // TODO: Integrar con API de carriers (Andreani, OCA, etc.)
        // Por ahora, tarifa fija según provincia
        $provinceRates = [
            'Buenos Aires' => 150000, // $1500 en centavos
            'CABA' => 100000,
            'Córdoba' => 200000,
            'Santa Fe' => 180000,
            'Mendoza' => 250000,
        ];

        $province = $address['province'] ?? '';
        return $provinceRates[$province] ?? 200000; // Default $2000
    }
}
