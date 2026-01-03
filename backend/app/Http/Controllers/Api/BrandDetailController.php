<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrandDetail;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BrandDetailController extends Controller
{
    /**
     * Listar todos los detalles de marcas (público)
     */
    public function index()
    {
        $brandDetails = BrandDetail::active()
            ->orderBy('marca')
            ->get();

        return response()->json([
            'productos_deportivos' => $brandDetails
        ]);
    }

    /**
     * Listar todos (incluyendo inactivos) para admin
     */
    public function adminIndex()
    {
        $brandDetails = BrandDetail::orderBy('marca')->get();

        return response()->json([
            'productos_deportivos' => $brandDetails,
            'total' => $brandDetails->count()
        ]);
    }

    /**
     * Obtener detalle de una marca específica por nombre
     */
    public function showByBrand(string $brand)
    {
        $brandDetail = BrandDetail::byBrand($brand)->first();

        if (!$brandDetail) {
            return response()->json([
                'message' => 'No se encontraron detalles para esta marca'
            ], 404);
        }

        return response()->json($brandDetail);
    }

    /**
     * Obtener detalle por ID
     */
    public function show(BrandDetail $brandDetail)
    {
        return response()->json($brandDetail);
    }

    /**
     * Crear nuevo detalle de marca
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'marca' => 'required|string|max:100|unique:brand_details,marca',
            'actividad_apta' => 'nullable|array',
            'actividad_apta.*' => 'string',
            'beneficios_materiales' => 'nullable|array',
            'beneficios_materiales.*' => 'string',
            'descripcion_detallada' => 'nullable|string',
            'logo_url' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $brandDetail = BrandDetail::create($validated);

        return response()->json([
            'message' => 'Detalle de marca creado correctamente',
            'brand_detail' => $brandDetail
        ], 201);
    }

    /**
     * Actualizar detalle de marca
     */
    public function update(Request $request, BrandDetail $brandDetail)
    {
        $validated = $request->validate([
            'marca' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('brand_details', 'marca')->ignore($brandDetail->id)
            ],
            'actividad_apta' => 'nullable|array',
            'actividad_apta.*' => 'string',
            'beneficios_materiales' => 'nullable|array',
            'beneficios_materiales.*' => 'string',
            'descripcion_detallada' => 'nullable|string',
            'logo_url' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $brandDetail->update($validated);

        return response()->json([
            'message' => 'Detalle de marca actualizado correctamente',
            'brand_detail' => $brandDetail
        ]);
    }

    /**
     * Eliminar detalle de marca
     */
    public function destroy(BrandDetail $brandDetail)
    {
        $marca = $brandDetail->marca;
        $brandDetail->delete();

        return response()->json([
            'message' => "Detalle de marca '$marca' eliminado correctamente"
        ]);
    }

    /**
     * Importar desde JSON (para migración inicial)
     */
    public function importFromJson(Request $request)
    {
        $validated = $request->validate([
            'productos_deportivos' => 'required|array',
            'productos_deportivos.*.marca' => 'required|string|max:100',
            'productos_deportivos.*.actividad_apta' => 'nullable|array',
            'productos_deportivos.*.beneficios_materiales' => 'nullable|array',
        ]);

        $imported = 0;
        $updated = 0;
        $errors = [];

        foreach ($validated['productos_deportivos'] as $item) {
            try {
                $existing = BrandDetail::byBrand($item['marca'])->first();

                if ($existing) {
                    $existing->update([
                        'actividad_apta' => $item['actividad_apta'] ?? [],
                        'beneficios_materiales' => $item['beneficios_materiales'] ?? [],
                    ]);
                    $updated++;
                } else {
                    BrandDetail::create([
                        'marca' => $item['marca'],
                        'actividad_apta' => $item['actividad_apta'] ?? [],
                        'beneficios_materiales' => $item['beneficios_materiales'] ?? [],
                        'is_active' => true,
                    ]);
                    $imported++;
                }
            } catch (\Exception $e) {
                $errors[] = "Error con marca '{$item['marca']}': " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Importación completada',
            'imported' => $imported,
            'updated' => $updated,
            'errors' => $errors
        ]);
    }

    /**
     * Obtener lista de marcas únicas de productos sin detalle
     */
    public function brandsWithoutDetails()
    {
        $existingBrands = BrandDetail::pluck('marca')
            ->map(fn($m) => strtolower($m))
            ->toArray();

        $productBrands = \App\Models\Product::distinct()
            ->pluck('brand')
            ->filter()
            ->unique()
            ->filter(fn($brand) => !in_array(strtolower($brand), $existingBrands))
            ->values();

        return response()->json([
            'brands' => $productBrands
        ]);
    }
}
