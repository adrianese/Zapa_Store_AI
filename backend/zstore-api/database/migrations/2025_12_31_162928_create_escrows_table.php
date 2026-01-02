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
        Schema::create('escrows', function (Blueprint $table) {
            $table->id();
            $table->string('deal_id')->unique(); // hash único para blockchain
            $table->nullableMorphs('subject'); // order_id o auction_id
            $table->foreignId('depositor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('beneficiary_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('arbiter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('initiated'); // initiated, funded, released, refunded, disputed
            $table->bigInteger('amount_minor');
            $table->string('currency', 3)->default('ARS');
            $table->string('onchain_ref')->nullable(); // dirección del contrato o tx hash
            $table->string('network')->nullable(); // mainnet, sepolia, polygon
            $table->timestamp('funded_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'deal_id']);
            $table->index('onchain_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escrows');
    }
};
