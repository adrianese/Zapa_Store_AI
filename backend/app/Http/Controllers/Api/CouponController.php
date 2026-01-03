<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    /**
     * Listar todos los cupones (admin)
     */
    public function index(Request $request)
    {
        $query = Coupon::with('creator:id,name');

        // Filtros
        if ($request->has('status')) {
            switch ($request->status) {
                case 'active':
                    $query->active();
                    break;
                case 'inactive':
                    $query->where('is_active', false);
                    break;
                case 'expired':
                    $query->where('expires_at', '<', now());
                    break;
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $coupons = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $coupons,
        ]);
    }

    /**
     * Crear nuevo cupón
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:50|unique:coupons,code',
            'description' => 'nullable|string|max:255',
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'value' => 'required|numeric|min:0.01',
            'min_purchase' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'boolean',
            'applicable_categories' => 'nullable|array',
            'applicable_brands' => 'nullable|array',
        ]);

        // Generar código si no se proporcionó
        if (empty($validated['code'])) {
            $validated['code'] = $this->generateUniqueCode();
        }

        // Validaciones específicas por tipo
        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return response()->json([
                'success' => false,
                'message' => 'El porcentaje no puede ser mayor a 100%',
            ], 422);
        }

        $validated['code'] = strtoupper($validated['code']);
        $validated['created_by'] = $request->user()->id;

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cupón creado exitosamente',
            'data' => $coupon,
        ], 201);
    }

    /**
     * Mostrar un cupón específico
     */
    public function show(Coupon $coupon)
    {
        $coupon->load(['creator:id,name', 'users' => function ($q) {
            $q->select('users.id', 'users.name', 'users.email')
                ->latest('coupon_user.used_at')
                ->limit(10);
        }]);

        return response()->json([
            'success' => true,
            'data' => $coupon,
        ]);
    }

    /**
     * Actualizar cupón
     */
    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('coupons')->ignore($coupon->id)],
            'description' => 'nullable|string|max:255',
            'type' => ['sometimes', Rule::in(['percentage', 'fixed'])],
            'value' => 'sometimes|numeric|min:0.01',
            'min_purchase' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
            'applicable_categories' => 'nullable|array',
            'applicable_brands' => 'nullable|array',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cupón actualizado exitosamente',
            'data' => $coupon->fresh(),
        ]);
    }

    /**
     * Eliminar cupón
     */
    public function destroy(Coupon $coupon)
    {
        // No permitir eliminar si tiene usos
        if ($coupon->times_used > 0) {
            // Desactivar en lugar de eliminar
            $coupon->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Cupón desactivado (tiene historial de uso)',
            ]);
        }

        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cupón eliminado exitosamente',
        ]);
    }

    /**
     * Activar/Desactivar cupón
     */
    public function toggleStatus(Coupon $coupon)
    {
        $coupon->update(['is_active' => !$coupon->is_active]);

        return response()->json([
            'success' => true,
            'message' => $coupon->is_active ? 'Cupón activado' : 'Cupón desactivado',
            'data' => $coupon,
        ]);
    }

    /**
     * Validar cupón para checkout (público)
     */
    public function validate(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
            'items' => 'nullable|array',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Cupón no encontrado',
            ], 404);
        }

        // Verificar disponibilidad
        if (!$coupon->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Este cupón no está disponible o ha expirado',
            ]);
        }

        // Verificar si el usuario puede usarlo
        $user = $request->user();
        if ($user) {
            $canUse = $coupon->canBeUsedBy($user);
            if (!$canUse['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $canUse['message'],
                ]);
            }
        }

        // Calcular descuento
        $result = $coupon->calculateDiscount(
            $validated['subtotal'],
            $validated['items'] ?? []
        );

        if (!$result['valid']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'code' => $coupon->code,
                'description' => $coupon->description,
                'type' => $result['type'],
                'value' => $result['value'],
                'discount' => $result['discount'],
            ],
        ]);
    }

    /**
     * Aplicar cupón a una orden (usado internamente en checkout)
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'order_id' => 'required|exists:orders,id',
            'discount_applied' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))->firstOrFail();
        $user = $request->user();

        // Verificaciones
        if (!$coupon->isAvailable()) {
            return response()->json(['success' => false, 'message' => 'Cupón no disponible'], 400);
        }

        $canUse = $coupon->canBeUsedBy($user);
        if (!$canUse['valid']) {
            return response()->json(['success' => false, 'message' => $canUse['message']], 400);
        }

        // Registrar uso
        $coupon->recordUsage($user, $validated['discount_applied'], $validated['order_id']);

        return response()->json([
            'success' => true,
            'message' => 'Cupón aplicado',
        ]);
    }

    /**
     * Generar código único
     */
    private function generateUniqueCode(): string
    {
        do {
            $code = 'ZS' . strtoupper(Str::random(8));
        } while (Coupon::where('code', $code)->exists());

        return $code;
    }

    /**
     * Generar múltiples códigos
     */
    public function generateBulk(Request $request)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
            'prefix' => 'nullable|string|max:10',
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'value' => 'required|numeric|min:0.01',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
        ]);

        $codes = [];
        $prefix = strtoupper($validated['prefix'] ?? 'PROMO');

        for ($i = 0; $i < $validated['quantity']; $i++) {
            $code = $prefix . strtoupper(Str::random(6));
            while (Coupon::where('code', $code)->exists() || in_array($code, $codes)) {
                $code = $prefix . strtoupper(Str::random(6));
            }
            $codes[] = $code;
        }

        $coupons = [];
        foreach ($codes as $code) {
            $coupons[] = Coupon::create([
                'code' => $code,
                'description' => "Cupón generado en lote",
                'type' => $validated['type'],
                'value' => $validated['value'],
                'usage_limit' => 1,
                'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
                'expires_at' => $validated['expires_at'] ?? null,
                'is_active' => true,
                'created_by' => $request->user()->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Se generaron {$validated['quantity']} cupones",
            'data' => $coupons,
        ], 201);
    }
}
