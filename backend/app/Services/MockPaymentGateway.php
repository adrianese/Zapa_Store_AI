<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MockPaymentGateway implements PaymentGatewayInterface
{
    public function createPaymentIntent(int $amount, string $currency, array $metadata = [])
    {
        Log::info('Mocking payment intent creation', compact('amount', 'currency', 'metadata'));
        return [
            'client_secret' => 'pi_' . bin2hex(random_bytes(24)) . '_secret_' . bin2hex(random_bytes(24)),
            'payment_intent_id' => 'pi_' . bin2hex(random_bytes(24)),
            'amount' => $amount,
            'currency' => $currency,
        ];
    }

    public function handleWebhook(array $payload)
    {
        Log::info('Mocking handling of payment webhook', $payload);
        // Simulate handling a 'payment_intent.succeeded' event
        if ($payload['type'] === 'payment_intent.succeeded') {
            $paymentIntentId = $payload['data']['object']['id'];
            // Here you would typically update your order status to 'paid'
            Log::info("Payment succeeded for intent: {$paymentIntentId}");
        }
        return true;
    }
}
