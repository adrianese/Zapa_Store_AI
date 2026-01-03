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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('brand');
            $table->string('model')->nullable();
            $table->string('colorway')->nullable();
            $table->bigInteger('price_minor'); // precio en centavos
            $table->string('currency', 3)->default('ARS');
            $table->integer('stock')->default(0);
            $table->json('images')->nullable(); // array de URLs
            $table->json('attributes')->nullable(); // actividad, género, etc
            $table->text('description')->nullable();
            $table->boolean('available')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['brand', 'available']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
