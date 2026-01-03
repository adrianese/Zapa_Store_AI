<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentGatewayInterface;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $paymentGateway;

    public function __construct(PaymentGatewayInterface $paymentGateway)
    {
        $this->paymentGateway = $paymentGateway;
    }

    public function createPaymentIntent(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'currency' => 'required|string|size:3',
            'metadata' => 'nullable|array'
        ]);

        $paymentIntent = $this->paymentGateway->createPaymentIntent($validated['amount'], $validated['currency'], $validated['metadata'] ?? []);

        return response()->json($paymentIntent);
    }

    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        $this->paymentGateway->handleWebhook($payload);

        return response()->json(['status' => 'success']);
    }
}
