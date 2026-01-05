<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuctionController;
use App\Http\Controllers\Api\DetallesController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\BrandDetailController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\CouponController;

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================


// Autenticación
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Configuración pública
Route::get('/settings/public', [SettingController::class, 'publicSettings']);

// Productos
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);

// Listings
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{listing}', [ListingController::class, 'show']);

// Subastas (lectura pública)
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/active', [AuctionController::class, 'active']);
Route::get('/auctions/active-list', [AuctionController::class, 'activeList']);
Route::get('/auctions/{id}', [AuctionController::class, 'show']);

// Detalles/catálogo
Route::get('/detalles', [DetallesController::class, 'index']);
Route::get('/detalles/{marca}', [DetallesController::class, 'show']);

// Detalles de marca (público - desde base de datos)
Route::get('/brand-details', [BrandDetailController::class, 'index']);
Route::get('/brand-details/by-brand/{brand}', [BrandDetailController::class, 'showByBrand']);

// Webhooks (sin auth, verificación por firma)
Route::post('/payment-webhook', [PaymentController::class, 'handleWebhook']);

// Cotización de envío (público para mostrar antes de login)
Route::post('/shipments/quote', [ShipmentController::class, 'quote']);
Route::get('/shipments/track/{trackingNumber}', [ShipmentController::class, 'track']);

// Validar cupón (puede ser sin auth para mostrar descuento)
Route::post('/coupons/validate', [CouponController::class, 'validate']);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // ==========================================
    // RUTAS PROTEGIDAS POR ROL (solo admin)
    // ==========================================
    // Route::middleware('role:admin')->group(function() {
        // ==========================================
        // ADMIN DASHBOARD Y MÉTRICAS
        // ==========================================
        Route::get('/admin/metrics', [AdminController::class, 'metrics']);
        Route::get('/admin/reports', [AdminController::class, 'reports']);
        Route::get('/admin/audit-logs', [AdminController::class, 'auditLogs']);

        // Settings (admin)
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);
        Route::put('/settings/{key}', [SettingController::class, 'updateSingle']);
        Route::post('/settings/reset', [SettingController::class, 'reset']);

        // Admin Orders
        Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
        Route::get('/admin/orders/{order}', [OrderController::class, 'adminShow']);
        Route::put('/admin/orders/{order}/status', [OrderController::class, 'adminUpdateStatus']);
        Route::put('/admin/orders/{order}/tracking', [OrderController::class, 'adminUpdateTracking']);
        Route::post('/admin/orders/{order}/delivered', [OrderController::class, 'adminMarkDelivered']);

        // Products (admin)
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/products/{product}/images', [ProductController::class, 'uploadImages']);
        Route::put('/products/{product}/sizes', [ProductController::class, 'updateSizes']);

        // Gestión avanzada de usuarios (solo admin)
        Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'show']);
        Route::put('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
        Route::post('/users/{id}/role', [\App\Http\Controllers\Api\UserController::class, 'assignRole']);

        // ==========================================
        // CUPONES (admin CRUD)
        // ==========================================
        Route::get('/coupons', [CouponController::class, 'index']);
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::get('/coupons/{coupon}', [CouponController::class, 'show']);
        Route::put('/coupons/{coupon}', [CouponController::class, 'update']);
        Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy']);
        Route::post('/coupons/{coupon}/toggle', [CouponController::class, 'toggleStatus']);
        Route::post('/coupons/generate-bulk', [CouponController::class, 'generateBulk']);

        // Subastas (crear/editar)
        Route::post('/auctions', [AuctionController::class, 'store']);
        Route::put('/auctions/{id}', [AuctionController::class, 'update']);
        Route::delete('/auctions/{id}', [AuctionController::class, 'destroy']);

        // Productos en subasta
        Route::get('/auctions/{id}/products', [AuctionController::class, 'products']);
        Route::post('/auctions/{id}/products', [AuctionController::class, 'updateProducts']);

        // Pausar/reanudar subasta
        Route::post('/auctions/{id}/pause', [AuctionController::class, 'pause']);
        Route::post('/auctions/{id}/resume', [AuctionController::class, 'resume']);

        // Orders (admin) - rutas alias para compatibilidad
        Route::get('/orders', [OrderController::class, 'adminIndex']);
        Route::put('/orders/{order}/status', [OrderController::class, 'adminUpdateStatus']);

        // Brand Details (admin CRUD)
        Route::get('/brand-details/admin', [BrandDetailController::class, 'adminIndex']);
        Route::get('/brand-details/without-details', [BrandDetailController::class, 'brandsWithoutDetails']);
        Route::post('/brand-details', [BrandDetailController::class, 'store']);
        Route::get('/brand-details/{brandDetail}', [BrandDetailController::class, 'show']);
        Route::put('/brand-details/{brandDetail}', [BrandDetailController::class, 'update']);
        Route::delete('/brand-details/{brandDetail}', [BrandDetailController::class, 'destroy']);
        Route::post('/brand-details/import', [BrandDetailController::class, 'importFromJson']);
    // });

    // Cierre automático de subastas (admin/scheduler)
    Route::post('/auctions/close-ended', [AuctionController::class, 'closeEndedAuctions']);

    // Auth - Usuario autenticado
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // ==========================================
    // NOTIFICACIONES
    // ==========================================
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::get('/notifications/count', [NotificationController::class, 'count']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications/clear-read', [NotificationController::class, 'clearRead']);

    // ==========================================
    // CHECKOUT Y DIRECCIONES DE ENVÍO
    // ==========================================
    Route::get('/checkout/addresses', [CheckoutController::class, 'getShippingAddresses']);
    Route::post('/checkout/addresses', [CheckoutController::class, 'createShippingAddress']);
    Route::put('/checkout/addresses/{shippingAddress}', [CheckoutController::class, 'updateShippingAddress']);
    Route::delete('/checkout/addresses/{shippingAddress}', [CheckoutController::class, 'deleteShippingAddress']);
    Route::post('/checkout/init', [CheckoutController::class, 'initCheckout']);
    Route::post('/checkout/confirm', [CheckoutController::class, 'confirmCheckout']);
    Route::post('/checkout/blockchain-payment', [CheckoutController::class, 'confirmBlockchainPayment']);
    Route::get('/checkout/orders/{order}', [CheckoutController::class, 'getOrder']);

    // Listings (sellers)
    Route::post('/listings', [ListingController::class, 'store']);
    Route::put('/listings/{listing}/confirm', [ListingController::class, 'confirm']);

    // Órdenes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/from-blockchain', [OrderController::class, 'storeFromBlockchain']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    // Bids
    Route::get('/bids', [BidController::class, 'index']);
    Route::get('/bids/min-amount', [BidController::class, 'getMinBid']);
    Route::post('/bids', [BidController::class, 'store']);

    // Pagos
    Route::post('/payments/create-payment-intent', [PaymentController::class, 'createPaymentIntent']);

    // Envíos (admin)
    Route::get('/shipments/{id}', [ShipmentController::class, 'show']);
    Route::put('/shipments/{id}', [ShipmentController::class, 'updateStatus']);

    // Administración de detalles
    Route::post('/detalles', [DetallesController::class, 'store']);
    Route::put('/detalles/{marca}', [DetallesController::class, 'update']);
    Route::delete('/detalles/{marca}', [DetallesController::class, 'destroy']);

    // Brand Details (admin)
    Route::get('/brand-details/admin', [BrandDetailController::class, 'adminIndex']);
    Route::get('/brand-details/without-details', [BrandDetailController::class, 'brandsWithoutDetails']);
    Route::post('/brand-details', [BrandDetailController::class, 'store']);
    Route::put('/brand-details/{brandDetail}', [BrandDetailController::class, 'update']);
    Route::delete('/brand-details/{brandDetail}', [BrandDetailController::class, 'destroy']);
});



