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
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->timestamp('start_at');
            $table->timestamp('end_at');
            $table->bigInteger('reserve_price_minor')->nullable();
            $table->bigInteger('starting_bid_minor');
            $table->bigInteger('current_bid_minor')->nullable();
            $table->foreignId('winner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending'); // pending, active, completed, cancelled
            $table->json('rules')->nullable(); // incrementos mínimos, restricciones, etc
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'end_at']);
            $table->index('start_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
