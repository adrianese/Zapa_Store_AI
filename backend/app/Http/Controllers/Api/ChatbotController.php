<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    /**
     * Handle incoming chatbot messages.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'sometimes|string|max:255',
        ]);

        $message = Str::lower($validated['message']);
        $intent = $this->detectIntent($message);
        $response = $this->generateResponse($intent, $message);

        // Log the interaction for auditing and improvement
        Log::channel('chatbot')->info('Chatbot Interaction', [
            'session_id' => $validated['session_id'] ?? 'unknown',
            'message' => $message,
            'intent' => $intent,
            'response' => $response['message'],
        ]);

        return response()->json($response);
    }

    /**
     * Detect user intent based on the message content.
     *
     * @param  string  $message
     * @return string
     */
    private function detectIntent(string $message): string
    {
        if (Str::contains($message, ['order', 'pedido', 'status', 'estado'])) {
            return 'GET_ORDER_STATUS';
        }

        if (Str::contains($message, ['product', 'producto', 'stock', 'zapatilla'])) {
            return 'SEARCH_PRODUCT';
        }

        if (Str::contains($message, ['dispute', 'disputa', 'problem', 'problema'])) {
            return 'START_DISPUTE';
        }

        if (Str::contains($message, ['bid', 'pujar', 'subasta', 'auction'])) {
            return 'PLACE_BID';
        }

        if (Str::contains($message, ['identity', 'identidad', 'verify', 'verificar'])) {
            return 'VERIFY_IDENTITY';
        }

        if (Str::contains($message, ['hello', 'hola', 'gracias', 'thanks'])) {
            return 'GREETING';
        }

        return 'UNKNOWN';
    }

    /**
     * Generate a response based on the detected intent.
     *
     * @param  string  $intent
     * @param  string  $message
     * @return array
     */
    private function generateResponse(string $intent, string $message): array
    {
        // This is a placeholder for more complex logic, which might involve
        // calling other services, fetching data from the database, or
        // interacting with an external AI service.

        switch ($intent) {
            case 'GET_ORDER_STATUS':
                // In a real implementation, we would extract an order ID and query it.
                return ['message' => 'To check your order status, please provide your order number.'];
            case 'SEARCH_PRODUCT':
                return ['message' => 'I can help with that. What product are you looking for?'];
            case 'START_DISPUTE':
                return ['message' => 'To start a dispute, please provide the order number and a description of the issue.'];
            case 'PLACE_BID':
                return ['message' => 'Bidding is handled on the auction page. Are you looking for a specific auction?'];
            case 'VERIFY_IDENTITY':
                return ['message' => 'You can verify your identity in your account profile section.'];
            case 'GREETING':
                return ['message' => 'Hello! How can I help you today?'];
            default:
                return ['message' => "I'm sorry, I don't understand that request. I can help with order status, product searches, and auctions."];
        }
    }
}
