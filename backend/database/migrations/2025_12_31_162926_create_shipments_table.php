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
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique()->nullable();
            $table->json('address'); // calle, ciudad, provincia, CP, país
            $table->string('carrier')->nullable(); // Andreani, OCA, Correo
            $table->string('carrier_ref')->nullable();
            $table->string('status')->default('pending'); // pending, processing, in_transit, delivered, failed
            $table->bigInteger('cost_minor')->default(0);
            $table->string('currency', 3)->default('ARS');
            $table->timestamp('estimated_delivery')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->json('tracking_events')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('tracking_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
