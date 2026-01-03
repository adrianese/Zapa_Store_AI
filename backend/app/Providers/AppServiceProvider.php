<?php

namespace App\Providers;

use App\Services\AuctionSmartContractServiceInterface;
use App\Services\MockAuctionSmartContractService;
use App\Services\PaymentGatewayInterface;
use App\Services\MockPaymentGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuctionSmartContractServiceInterface::class, MockAuctionSmartContractService::class);
        $this->app->singleton(PaymentGatewayInterface::class, MockPaymentGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

