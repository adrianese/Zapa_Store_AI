<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Escrow;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class EscrowController extends Controller
{
    /**
     * Initialize a new escrow process for an order or auction.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function init(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required_without:auction_id|exists:orders,id',
            'auction_id' => 'required_without:order_id|exists:auctions,id',
            'arbiter_id' => 'sometimes|exists:users,id', // Arbiter might be assigned systemically
        ]);

        $user = Auth::user();
        $subject = null;

        if ($request->has('order_id')) {
            $subject = Order::findOrFail($validated['order_id']);
            // Ensure the authenticated user is the buyer of the order
            if ($subject->buyer_id !== $user->id) {
                return response()->json(['message' => 'You are not authorized to create an escrow for this order.'], 403);
            }
        }
        
        // TODO: Add similar logic for Auction ownership when that model is more defined.

        $dealId = 'deal-' . Str::uuid(); // A unique identifier for the escrow deal

        // Determine the parties involved
        $depositor = $user->id; // The one paying into escrow (buyer)
        $beneficiary = $subject->seller_id; // The one receiving funds (seller) - needs to be added to Order model
        $arbiter = $validated['arbiter_id'] ?? null; // A neutral third party, could be a system admin ID

        // Placeholder for beneficiary if not on the order model yet.
        if (!$beneficiary) {
            // In a real scenario, this would be a hard failure.
            // For now, we'll assign a placeholder.
            $beneficiary = 2; // Assuming a 'seller' user with ID 2 exists.
        }

        $escrow = Escrow::create([
            'deal_id' => $dealId,
            'subject_type' => $request->has('order_id') ? Order::class : Auction::class,
            'subject_id' => $subject->id,
            'depositor_id' => $depositor,
            'beneficiary_id' => $beneficiary,
            'arbiter_id' => $arbiter,
            'status' => 'initiated',
            'onchain_ref' => null, // This would be populated after interacting with the smart contract
        ]);

        // --- Smart Contract Interaction (Placeholder) ---
        // 1. Generate a unique hash or deal ID for the contract.
        // 2. Call the `init` function on the Escrow.sol smart contract.
        //    $tx = EscrowContractService::init($dealId, $beneficiaryAddress, $arbiterAddress);
        // 3. Save the transaction hash or on-chain reference.
        //    $escrow->update(['onchain_ref' => $tx->hash]);
        // -----------------------------------------------

        return response()->json([
            'success' => true,
            'message' => 'Escrow initiated successfully.',
            'data' => $escrow,
        ], 201);
    }

    // Other methods like fund, release, refund, dispute would go here.
}
