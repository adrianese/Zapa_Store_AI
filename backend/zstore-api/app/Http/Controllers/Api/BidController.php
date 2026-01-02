<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Services\AuctionSmartContractServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    protected $auctionService;

    public function __construct(AuctionSmartContractServiceInterface $auctionService)
    {
        $this->auctionService = $auctionService;
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|exists:auctions,id',
            'amount_minor' => 'required|integer|min:1',
        ]);

        $auction = Auction::findOrFail($request->auction_id);
        $user = Auth::user();

        // Verify that the auction is active
        if ($auction->status !== 'active' || $auction->end_at < now()) {
            return response()->json(['message' => 'Auction is not active.'], 400);
        }

        // Verify that the bid is higher than the current one
        $currentBid = $auction->current_bid_minor ?? $auction->starting_bid_minor;
        if ($request->amount_minor <= $currentBid) {
            return response()->json([
                'message' => 'Bid must be higher than the current bid.',
                'current_bid' => $currentBid
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Blockchain interaction (assuming service exists)
            // $this->auctionService->placeBid($auction->id, $request->amount_minor, $user->id);

            // Create the bid
            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $user->id,
                'amount_minor' => $request->amount_minor,
                'bid_at' => now(),
            ]);

            // Update the auction's latest bid info
            $auction->update([
                'current_bid_minor' => $request->amount_minor,
                'winner_id' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bid placed successfully.',
                'data' => $bid
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            // Log the exception for debugging
            \Illuminate\Support\Facades\Log::error('Error placing bid: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred while placing the bid.'], 500);
        }
    }
}
