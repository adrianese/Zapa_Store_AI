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
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The seller
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            
            $table->unsignedBigInteger('marketplace_item_id')->nullable()->index(); // The on-chain ID from the smart contract
            $table->string('status')->default('pending_creation'); // e.g., pending_creation, active, sold, cancelled
            $table->string('transaction_hash')->nullable();

            // We can duplicate price here to store it at the time of listing
            $table->unsignedInteger('price_minor');
            $table->string('currency', 3);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
