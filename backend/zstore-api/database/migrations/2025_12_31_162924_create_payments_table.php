<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->string('method'); // card, cash, crypto, escrow
            $table->string('provider')->nullable(); // stripe, mercadopago, etc
            $table->string('provider_ref')->nullable(); // ID del proveedor
            $table->bigInteger('amount_minor');
            $table->string('currency', 3)->default('ARS');
            $table->string('status')->default('pending'); // pending, authorized, captured, failed, refunded
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'method']);
            $table->index('provider_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
