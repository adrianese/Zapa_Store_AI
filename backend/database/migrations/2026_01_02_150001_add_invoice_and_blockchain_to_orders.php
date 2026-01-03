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
        Schema::table('orders', function (Blueprint $table) {
            // Datos de facturación
            $table->string('invoice_number')->nullable()->unique()->after('order_number');
            $table->timestamp('invoice_date')->nullable()->after('invoice_number');

            // Blockchain payment
            $table->string('transaction_hash')->nullable()->after('payment_id');
            $table->string('payment_method')->default('traditional')->after('transaction_hash'); // traditional, blockchain
            $table->string('wallet_address')->nullable()->after('payment_method');

            // Shipping address snapshot (guardamos copia por si el usuario cambia su dirección)
            $table->json('shipping_address_snapshot')->nullable()->after('shipment_id');
            $table->foreignId('shipping_address_id')->nullable()->after('shipping_address_snapshot')
                  ->constrained('shipping_addresses')->nullOnDelete();

            $table->index('transaction_hash');
            $table->index('invoice_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['shipping_address_id']);
            $table->dropIndex(['transaction_hash']);
            $table->dropIndex(['invoice_number']);
            $table->dropColumn([
                'invoice_number',
                'invoice_date',
                'transaction_hash',
                'payment_method',
                'wallet_address',
                'shipping_address_snapshot',
                'shipping_address_id'
            ]);
        });
    }
};
