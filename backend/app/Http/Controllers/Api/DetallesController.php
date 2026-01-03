<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DetallesController
{
    /**
     * Obtener todos los detalles de marcas
     */
    public function index()
    {
        try {
            $detallesPath = public_path('detalles.json');

            if (!file_exists($detallesPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de detalles no encontrado'
                ], 404);
            }

            $contenido = file_get_contents($detallesPath);
            $detalles = json_decode($contenido, true);

            return response()->json([
                'success' => true,
                'data' => $detalles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalles de una marca específica
     */
    public function show($marca)
    {
        try {
            $detallesPath = public_path('detalles.json');

            if (!file_exists($detallesPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de detalles no encontrado'
                ], 404);
            }

            $contenido = file_get_contents($detallesPath);
            $detalles = json_decode($contenido, true);

            $marcaDetalle = null;
            if (isset($detalles['productos_deportivos'])) {
                foreach ($detalles['productos_deportivos'] as $detalle) {
                    if (strtolower($detalle['marca']) === strtolower($marca)) {
                        $marcaDetalle = $detalle;
                        break;
                    }
                }
            }

            if (!$marcaDetalle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Detalles de la marca no encontrados'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $marcaDetalle
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalles de la marca',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar detalles de una marca (solo admin)
     */
    public function update(Request $request, $marca)
    {
        $validator = Validator::make($request->all(), [
            'actividad_apta' => 'required|array',
            'actividad_apta.*' => 'required|string',
            'beneficios_materiales' => 'required|array',
            'beneficios_materiales.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $detallesPath = public_path('detalles.json');

            if (!file_exists($detallesPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de detalles no encontrado'
                ], 404);
            }

            $contenido = file_get_contents($detallesPath);
            $detalles = json_decode($contenido, true);

            $marcaEncontrada = false;
            if (isset($detalles['productos_deportivos'])) {
                foreach ($detalles['productos_deportivos'] as &$detalle) {
                    if (strtolower($detalle['marca']) === strtolower($marca)) {
                        $detalle['actividad_apta'] = $request->actividad_apta;
                        $detalle['beneficios_materiales'] = $request->beneficios_materiales;
                        $marcaEncontrada = true;
                        break;
                    }
                }
            }

            if (!$marcaEncontrada) {
                return response()->json([
                    'success' => false,
                    'message' => 'Marca no encontrada'
                ], 404);
            }

            // Guardar cambios
            file_put_contents(
                $detallesPath,
                json_encode($detalles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );

            return response()->json([
                'success' => true,
                'message' => 'Detalles actualizados correctamente',
                'data' => [
                    'marca' => $marca,
                    'actividad_apta' => $request->actividad_apta,
                    'beneficios_materiales' => $request->beneficios_materiales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar detalles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear detalles para una nueva marca (solo admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'marca' => 'required|string',
            'actividad_apta' => 'required|array',
            'actividad_apta.*' => 'required|string',
            'beneficios_materiales' => 'required|array',
            'beneficios_materiales.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $detallesPath = public_path('detalles.json');

            $detalles = ['productos_deportivos' => []];

            if (file_exists($detallesPath)) {
                $contenido = file_get_contents($detallesPath);
                $detalles = json_decode($contenido, true);
            }

            // Verificar si la marca ya existe
            if (isset($detalles['productos_deportivos'])) {
                foreach ($detalles['productos_deportivos'] as $detalle) {
                    if (strtolower($detalle['marca']) === strtolower($request->marca)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'La marca ya tiene detalles registrados'
                        ], 409);
                    }
                }
            }

            // Agregar nueva marca
            $detalles['productos_deportivos'][] = [
                'marca' => $request->marca,
                'actividad_apta' => $request->actividad_apta,
                'beneficios_materiales' => $request->beneficios_materiales
            ];

            // Guardar cambios
            file_put_contents(
                $detallesPath,
                json_encode($detalles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );

            return response()->json([
                'success' => true,
                'message' => 'Detalles creados correctamente',
                'data' => [
                    'marca' => $request->marca,
                    'actividad_apta' => $request->actividad_apta,
                    'beneficios_materiales' => $request->beneficios_materiales
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear detalles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar detalles de una marca (solo admin)
     */
    public function destroy($marca)
    {
        try {
            $detallesPath = public_path('detalles.json');

            if (!file_exists($detallesPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de detalles no encontrado'
                ], 404);
            }

            $contenido = file_get_contents($detallesPath);
            $detalles = json_decode($contenido, true);

            $marcaEncontrada = false;
            if (isset($detalles['productos_deportivos'])) {
                foreach ($detalles['productos_deportivos'] as $index => $detalle) {
                    if (strtolower($detalle['marca']) === strtolower($marca)) {
                        unset($detalles['productos_deportivos'][$index]);
                        // Reindexar el array
                        $detalles['productos_deportivos'] = array_values($detalles['productos_deportivos']);
                        $marcaEncontrada = true;
                        break;
                    }
                }
            }

            if (!$marcaEncontrada) {
                return response()->json([
                    'success' => false,
                    'message' => 'Marca no encontrada'
                ], 404);
            }

            // Guardar cambios
            file_put_contents(
                $detallesPath,
                json_encode($detalles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );

            return response()->json([
                'success' => true,
                'message' => 'Detalles eliminados correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar detalles',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
