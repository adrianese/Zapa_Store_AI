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

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================


// Autenticación
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Productos
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);

// Listings
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{listing}', [ListingController::class, 'show']);

// Subastas (lectura pública)
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/active', [AuctionController::class, 'active']);
Route::get('/auctions/{id}', [AuctionController::class, 'show']);

// Detalles/catálogo
Route::get('/detalles', [DetallesController::class, 'index']);
Route::get('/detalles/{marca}', [DetallesController::class, 'show']);

// Webhooks (sin auth, verificación por firma)
Route::post('/payment-webhook', [PaymentController::class, 'handleWebhook']);

// Cotización de envío (público para mostrar antes de login)
Route::post('/shipments/quote', [ShipmentController::class, 'quote']);
Route::get('/shipments/track/{trackingNumber}', [ShipmentController::class, 'track']);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // ==========================================
    // RUTAS PROTEGIDAS POR ROL (solo admin)
    // ==========================================
    Route::middleware('role:admin')->group(function() {
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

        // Orders (admin)
        Route::get('/orders', [OrderController::class, 'adminIndex']);
        Route::put('/orders/{order}/status', [OrderController::class, 'adminUpdateStatus']);
    });

    // Cierre automático de subastas (admin/scheduler)
    Route::post('/auctions/close-ended', [AuctionController::class, 'closeEndedAuctions']);

    // Auth - Usuario autenticado
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

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
});

