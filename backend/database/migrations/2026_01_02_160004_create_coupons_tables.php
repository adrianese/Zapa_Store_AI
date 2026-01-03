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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('description')->nullable();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2); // Porcentaje o monto fijo
            $table->decimal('min_purchase', 10, 2)->nullable(); // Compra mínima requerida
            $table->decimal('max_discount', 10, 2)->nullable(); // Descuento máximo (para porcentaje)
            $table->integer('usage_limit')->nullable(); // Límite de usos totales
            $table->integer('usage_limit_per_user')->default(1); // Usos por usuario
            $table->integer('times_used')->default(0); // Veces usado
            $table->timestamp('starts_at')->nullable(); // Fecha inicio
            $table->timestamp('expires_at')->nullable(); // Fecha expiración
            $table->boolean('is_active')->default(true);
            $table->json('applicable_categories')->nullable(); // Categorías aplicables
            $table->json('applicable_brands')->nullable(); // Marcas aplicables
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['starts_at', 'expires_at']);
        });

        // Tabla pivot para tracking de uso por usuario
        Schema::create('coupon_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('discount_applied', 10, 2);
            $table->timestamp('used_at');

            $table->index(['coupon_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_user');
        Schema::dropIfExists('coupons');
    }
};
