<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Order;
use App\Models\ShippingAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    /**
     * Obtener direcciones de envío del usuario
     */
    public function getShippingAddresses(Request $request)
    {
        $addresses = $request->user()->shippingAddresses()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($addresses);
    }

    /**
     * Crear nueva dirección de envío
     */
    public function createShippingAddress(Request $request)
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'street' => 'required|string|max:200',
            'apartment' => 'nullable|string|max:50',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'nullable|string|max:100',
            'instructions' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        $address = $request->user()->shippingAddresses()->create($validated);

        // Si es la primera dirección o se marcó como default
        if ($validated['is_default'] ?? false || $request->user()->shippingAddresses()->count() === 1) {
            $address->setAsDefault();
        }

        return response()->json($address, 201);
    }

    /**
     * Actualizar dirección de envío
     */
    public function updateShippingAddress(Request $request, ShippingAddress $shippingAddress)
    {
        // Verificar que pertenece al usuario
        if ($shippingAddress->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'street' => 'required|string|max:200',
            'apartment' => 'nullable|string|max:50',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'nullable|string|max:100',
            'instructions' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        $shippingAddress->update($validated);

        if ($validated['is_default'] ?? false) {
            $shippingAddress->setAsDefault();
        }

        return response()->json($shippingAddress);
    }

    /**
     * Eliminar dirección de envío
     */
    public function deleteShippingAddress(Request $request, ShippingAddress $shippingAddress)
    {
        if ($shippingAddress->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // No eliminar si tiene órdenes asociadas
        if ($shippingAddress->orders()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar una dirección con órdenes asociadas'
            ], 422);
        }

        $shippingAddress->delete();

        return response()->json(['message' => 'Dirección eliminada']);
    }

    /**
     * Iniciar checkout - crear orden pendiente
     */
    public function initCheckout(Request $request)
    {
        $validated = $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'size' => 'nullable|string|max:10',
            'quantity' => 'integer|min:1|max:10',
        ]);

        $listing = Listing::with('product', 'seller')->findOrFail($validated['listing_id']);

        // Verificar que el listing está activo
        if ($listing->status !== 'active') {
            return response()->json([
                'message' => 'Este producto ya no está disponible'
            ], 422);
        }

        // Verificar stock si hay talle
        if (!empty($validated['size'])) {
            $size = $listing->product->sizes()->where('size', $validated['size'])->first();
            if (!$size || $size->stock < ($validated['quantity'] ?? 1)) {
                return response()->json([
                    'message' => 'No hay stock disponible para el talle seleccionado'
                ], 422);
            }
        }

        // Calcular totales
        $quantity = $validated['quantity'] ?? 1;
        $subtotal = $listing->price_minor * $quantity;
        $shippingCost = $this->calculateShipping($listing, $request->user());
        $tax = 0; // TODO: Calcular impuestos según configuración
        $total = $subtotal + $shippingCost + $tax;

        // Preparar items
        $items = [
            [
                'product_id' => $listing->product_id,
                'listing_id' => $listing->id,
                'name' => $listing->product->name,
                'brand' => $listing->product->brand,
                'size' => $validated['size'] ?? null,
                'quantity' => $quantity,
                'unit_price_minor' => $listing->price_minor,
                'total_price_minor' => $subtotal,
                'image' => $listing->product->images[0] ?? null,
            ]
        ];

        // Retornar resumen de checkout (sin crear la orden todavía)
        return response()->json([
            'checkout_summary' => [
                'listing' => [
                    'id' => $listing->id,
                    'marketplace_item_id' => $listing->marketplace_item_id,
                    'product' => [
                        'id' => $listing->product->id,
                        'name' => $listing->product->name,
                        'brand' => $listing->product->brand,
                        'image' => $listing->product->images[0] ?? null,
                    ],
                    'price_minor' => $listing->price_minor,
                    'currency' => $listing->currency,
                ],
                'size' => $validated['size'] ?? null,
                'quantity' => $quantity,
                'subtotal_minor' => $subtotal,
                'shipping_minor' => $shippingCost,
                'tax_minor' => $tax,
                'total_minor' => $total,
                'currency' => $listing->currency,
                'seller' => [
                    'id' => $listing->seller_id,
                    'name' => $listing->seller->name ?? 'Vendedor',
                ],
            ],
            'user_addresses' => $request->user()->shippingAddresses()
                ->orderBy('is_default', 'desc')
                ->get(),
        ]);
    }

    /**
     * Confirmar checkout y crear orden (antes del pago blockchain)
     */
    public function confirmCheckout(Request $request)
    {
        $validated = $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'size' => 'nullable|string|max:10',
            'quantity' => 'integer|min:1|max:10',
            'shipping_address_id' => 'required_without:new_address|exists:shipping_addresses,id',
            'new_address' => 'required_without:shipping_address_id|array',
            'new_address.recipient_name' => 'required_with:new_address|string|max:100',
            'new_address.phone' => 'required_with:new_address|string|max:30',
            'new_address.street' => 'required_with:new_address|string|max:200',
            'new_address.apartment' => 'nullable|string|max:50',
            'new_address.city' => 'required_with:new_address|string|max:100',
            'new_address.province' => 'required_with:new_address|string|max:100',
            'new_address.postal_code' => 'required_with:new_address|string|max:20',
            'new_address.country' => 'nullable|string|max:100',
            'new_address.instructions' => 'nullable|string|max:500',
            'new_address.save_address' => 'boolean',
            'payment_method' => 'required|in:traditional,blockchain',
            'wallet_address' => 'required_if:payment_method,blockchain|nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $listing = Listing::with('product', 'seller')->findOrFail($validated['listing_id']);

        // Verificaciones
        if ($listing->status !== 'active') {
            throw ValidationException::withMessages([
                'listing_id' => ['Este producto ya no está disponible']
            ]);
        }

        return DB::transaction(function () use ($validated, $user, $listing) {
            // Manejar dirección de envío
            $shippingAddress = null;
            $addressSnapshot = null;

            if (!empty($validated['shipping_address_id'])) {
                $shippingAddress = ShippingAddress::where('id', $validated['shipping_address_id'])
                    ->where('user_id', $user->id)
                    ->firstOrFail();
                $addressSnapshot = $shippingAddress->toSnapshot();
            } elseif (!empty($validated['new_address'])) {
                $addressSnapshot = [
                    'recipient_name' => $validated['new_address']['recipient_name'],
                    'phone' => $validated['new_address']['phone'],
                    'street' => $validated['new_address']['street'],
                    'apartment' => $validated['new_address']['apartment'] ?? null,
                    'city' => $validated['new_address']['city'],
                    'province' => $validated['new_address']['province'],
                    'postal_code' => $validated['new_address']['postal_code'],
                    'country' => $validated['new_address']['country'] ?? 'Argentina',
                    'instructions' => $validated['new_address']['instructions'] ?? null,
                ];

                // Guardar como nueva dirección si el usuario lo solicita
                if (!empty($validated['new_address']['save_address'])) {
                    $shippingAddress = $user->shippingAddresses()->create(array_merge(
                        $addressSnapshot,
                        ['label' => 'Nueva dirección']
                    ));
                }
            }

            // Calcular totales
            $quantity = $validated['quantity'] ?? 1;
            $subtotal = $listing->price_minor * $quantity;
            $shippingCost = $this->calculateShipping($listing, $user);
            $tax = 0;
            $total = $subtotal + $shippingCost + $tax;

            // Items de la orden
            $items = [
                [
                    'product_id' => $listing->product_id,
                    'listing_id' => $listing->id,
                    'name' => $listing->product->name,
                    'brand' => $listing->product->brand,
                    'size' => $validated['size'] ?? null,
                    'quantity' => $quantity,
                    'unit_price_minor' => $listing->price_minor,
                    'total_price_minor' => $subtotal,
                    'image' => $listing->product->images[0] ?? null,
                ]
            ];

            // Crear la orden
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'buyer_id' => $user->id,
                'seller_id' => $listing->seller_id,
                'listing_id' => $listing->id,
                'items' => $items,
                'subtotal_minor' => $subtotal,
                'tax_minor' => $tax,
                'shipping_minor' => $shippingCost,
                'total_minor' => $total,
                'currency' => $listing->currency,
                'status' => Order::STATUS_AWAITING_PAYMENT,
                'payment_method' => $validated['payment_method'],
                'wallet_address' => $validated['wallet_address'] ?? null,
                'shipping_address_id' => $shippingAddress?->id,
                'shipping_address_snapshot' => $addressSnapshot,
                'notes' => $validated['notes'] ?? null,
            ]);

            Log::info('Order created', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'user_id' => $user->id,
                'payment_method' => $validated['payment_method'],
            ]);

            return response()->json([
                'order' => $order->load('listing.product'),
                'message' => 'Orden creada. Proceda con el pago.',
                'next_step' => $validated['payment_method'] === 'blockchain'
                    ? 'blockchain_payment'
                    : 'traditional_payment',
            ], 201);
        });
    }

    /**
     * Confirmar pago blockchain
     */
    public function confirmBlockchainPayment(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'transaction_hash' => 'required|string|regex:/^0x[a-fA-F0-9]{64}$/',
        ]);

        $order = Order::where('id', $validated['order_id'])
            ->where('buyer_id', $request->user()->id)
            ->where('status', Order::STATUS_AWAITING_PAYMENT)
            ->firstOrFail();

        // Verificar que es pago blockchain
        if ($order->payment_method !== Order::PAYMENT_BLOCKCHAIN) {
            return response()->json([
                'message' => 'Esta orden no es de pago blockchain'
            ], 422);
        }

        // TODO: Verificar la transacción en la blockchain (opcional pero recomendado)
        // $this->verifyBlockchainTransaction($validated['transaction_hash'], $order);

        $order->markAsPaid($validated['transaction_hash']);

        // Actualizar el listing a vendido
        $order->listing?->update(['status' => 'sold']);

        // Descontar stock si aplica
        if ($order->items[0]['size'] ?? null) {
            $size = $order->listing->product->sizes()
                ->where('size', $order->items[0]['size'])
                ->first();
            if ($size) {
                $size->decrement('stock', $order->items[0]['quantity'] ?? 1);
            }
        }

        Log::info('Blockchain payment confirmed', [
            'order_id' => $order->id,
            'transaction_hash' => $validated['transaction_hash'],
        ]);

        return response()->json([
            'order' => $order->fresh(['listing.product', 'shippingAddress']),
            'invoice_number' => $order->invoice_number,
            'message' => '¡Pago confirmado! Tu orden está siendo procesada.',
        ]);
    }

    /**
     * Obtener orden por ID
     */
    public function getOrder(Request $request, Order $order)
    {
        // Verificar que la orden pertenece al usuario
        if ($order->buyer_id !== $request->user()->id && $order->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        return response()->json(
            $order->load(['listing.product', 'shippingAddress', 'buyer', 'seller'])
        );
    }

    /**
     * Calcular costo de envío
     */
    private function calculateShipping(Listing $listing, $user): int
    {
        // TODO: Implementar lógica real de cálculo de envío
        // Por ahora, envío fijo de $1500 ARS
        return 150000; // 1500.00 en minor units
    }
}
