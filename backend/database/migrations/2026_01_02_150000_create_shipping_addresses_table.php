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
        Schema::create('shipping_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('label')->default('Principal'); // Casa, Trabajo, etc.
            $table->string('recipient_name'); // Nombre de quien recibe
            $table->string('phone');
            $table->string('street'); // Calle y número
            $table->string('apartment')->nullable(); // Piso/Depto
            $table->string('city');
            $table->string('province');
            $table->string('postal_code');
            $table->string('country')->default('Argentina');
            $table->text('instructions')->nullable(); // Instrucciones de entrega
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_addresses');
    }
};
