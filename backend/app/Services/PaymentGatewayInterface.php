<?php

namespace App\Services;

interface PaymentGatewayInterface
{
    public function createPaymentIntent(int $amount, string $currency, array $metadata = []);
    public function handleWebhook(array $payload);
}
