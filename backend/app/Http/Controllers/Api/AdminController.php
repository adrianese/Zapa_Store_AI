<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Auction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Obtener métricas generales del dashboard
     */
    public function metrics()
    {
        // Estadísticas básicas
        $totalProducts = Product::count();
        $totalOrders = Order::count();
        $totalUsers = User::count();
        $totalAuctions = Auction::count();

        // Ventas totales (solo órdenes pagadas/entregadas)
        $totalSales = Order::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->sum('total_minor');

        // Órdenes por estado
        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Ventas de los últimos 6 meses
        $salesByMonth = $this->getSalesByMonth(6);

        // Productos más vendidos (top 5)
        $topProducts = $this->getTopProducts(5);

        // Órdenes recientes (últimas 5)
        $recentOrders = Order::with('buyer:id,name,email')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_name' => $order->buyer?->name ?? 'Usuario',
                    'total_minor' => $order->total_minor,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                ];
            });

        // Métricas calculadas
        $avgTicket = $totalOrders > 0 ? round($totalSales / $totalOrders) : 0;

        // Nuevos usuarios este mes
        $newUsersThisMonth = User::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        // Nuevas órdenes esta semana
        $newOrdersThisWeek = Order::whereBetween('created_at', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'sales' => $totalSales,
                    'orders' => $totalOrders,
                    'products' => $totalProducts,
                    'users' => $totalUsers,
                    'auctions' => $totalAuctions,
                ],
                'ordersByStatus' => $ordersByStatus,
                'salesByMonth' => $salesByMonth,
                'topProducts' => $topProducts,
                'recentOrders' => $recentOrders,
                'metrics' => [
                    'avgTicket' => $avgTicket,
                    'newUsersThisMonth' => $newUsersThisMonth,
                    'newOrdersThisWeek' => $newOrdersThisWeek,
                ],
            ],
        ]);
    }

    /**
     * Obtener reportes avanzados
     */
    public function reports(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->subMonths(3)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        // Ventas por día en el rango
        $salesByDay = Order::selectRaw('DATE(created_at) as date, SUM(total_minor) as total, COUNT(*) as orders_count')
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Productos por categoría/marca
        $productsByBrand = Product::selectRaw('brand, COUNT(*) as count, SUM(stock) as total_stock')
            ->groupBy('brand')
            ->orderByDesc('count')
            ->get();

        // Usuarios por rol
        $usersByRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->selectRaw('roles.name as role, COUNT(*) as count')
            ->groupBy('roles.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
                'salesByDay' => $salesByDay,
                'productsByBrand' => $productsByBrand,
                'usersByRole' => $usersByRole,
            ],
        ]);
    }

    /**
     * Obtener logs de auditoría
     */
    public function auditLogs(Request $request)
    {
        $logs = AuditLog::with('user:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($logs);
    }

    /**
     * Obtener ventas por mes
     */
    private function getSalesByMonth(int $months): array
    {
        $salesByMonth = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthName = $date->locale('es')->isoFormat('MMM');

            $sales = Order::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                ->sum('total_minor');

            $salesByMonth[] = [
                'month' => ucfirst($monthName),
                'year' => $date->year,
                'sales' => $sales,
            ];
        }

        return $salesByMonth;
    }

    /**
     * Obtener productos más vendidos
     */
    private function getTopProducts(int $limit): array
    {
        // Obtener todas las órdenes y contar productos vendidos
        $orders = Order::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->get(['items']);

        $productSales = [];

        foreach ($orders as $order) {
            $items = $order->items;
            if (is_array($items)) {
                foreach ($items as $item) {
                    $productId = $item['product_id'] ?? null;
                    $quantity = $item['quantity'] ?? 1;
                    $name = $item['name'] ?? 'Producto';

                    if ($productId) {
                        if (!isset($productSales[$productId])) {
                            $productSales[$productId] = [
                                'product_id' => $productId,
                                'name' => $name,
                                'quantity_sold' => 0,
                            ];
                        }
                        $productSales[$productId]['quantity_sold'] += $quantity;
                    }
                }
            }
        }

        // Ordenar por cantidad vendida y tomar los primeros
        usort($productSales, fn($a, $b) => $b['quantity_sold'] - $a['quantity_sold']);

        return array_slice($productSales, 0, $limit);
    }
}
