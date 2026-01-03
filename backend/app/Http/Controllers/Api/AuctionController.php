<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Services\AuctionSmartContractServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuctionController extends Controller
{
    /**
     * Listar todas las subastas activas ordenadas por tiempo de finalización
     */
    public function activeList()
    {
        $auctions = Auction::with(['product.sizes'])
            ->where('status', 'active')
            ->where('start_at', '<=', now())
            ->where('end_at', '>', now())
            ->orderBy('end_at', 'asc')
            ->get();

        return response()->json(['data' => $auctions]);
    }
    /**
     * Cerrar subastas finalizadas, asignar ganador y gestionar pago.
     * Puede ser llamado por un scheduler/cron o manualmente.
     */
    public function closeEndedAuctions()
    {
        $now = now();
        $auctions = Auction::where('status', 'active')
            ->where('end_at', '<=', $now)
            ->get();

        foreach ($auctions as $auction) {
            $highestBid = $auction->bids()->orderByDesc('amount_minor')->first();

            // Desmarcar productos de la subasta
            $auction->products()->update(['in_auction' => false]);

            if ($highestBid) {
                // Descontar stock de todos los productos de la subasta (1 unidad por producto)
                foreach ($auction->products as $product) {
                    if ($product->available) {
                        $product->decrement('stock', 1);
                    }
                }
                $auction->update([
                    'status' => 'finished',
                    'winner_id' => $highestBid->user_id,
                    'current_bid_minor' => $highestBid->amount_minor,
                ]);
                // Disparar evento y lógica de pago/escrow
                event(new \App\Events\AuctionClosed($auction->fresh()));
            } else {
                $auction->update(['status' => 'finished']);
                event(new \App\Events\AuctionClosed($auction->fresh()));
            }
        }

        return response()->json(['message' => 'Subastas finalizadas procesadas', 'count' => $auctions->count()]);
    }
    protected $auctionService;

    public function __construct(AuctionSmartContractServiceInterface $auctionService)
    {
        $this->auctionService = $auctionService;
    }

    /**
     * Get active auction
     */
    public function active()
    {
        $auction = Auction::with(['product.sizes'])
            ->where('status', 'active')
            ->where('start_at', '<=', now())
            ->where('end_at', '>', now())
            ->first();

        if (!$auction) {
            return response()->json(['message' => 'No active auction'], 404);
        }

        return response()->json(['data' => $auction]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $auctions = Auction::with(['product'])->paginate(10);
        return response()->json(['data' => $auctions]);
    }


    /**
     * Store a newly created resource in storage (con múltiples productos).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'start_at' => 'required|date|after_or_equal:today',
            'end_at' => 'required|date|after:start_at',
            'starting_bid_minor' => 'required|integer|min:0',
            'reserve_price_minor' => 'nullable|integer|min:0',
            'status' => 'sometimes|in:pending,active',
            'rules' => 'nullable|json',
        ]);

        $auction = Auction::create($validated);

        // Si la subasta se crea como activa, marcar producto
        if (($validated['status'] ?? 'pending') === 'active') {
            $auction->product->update(['in_auction' => true]);
        }

        // Blockchain interaction
        $this->auctionService->createAuction($auction->toArray());

        return response()->json(['data' => $auction->load('product')], 201);
    }


    /**
     * Pausar subasta
     */
    public function pause($id)
    {
        $auction = Auction::findOrFail($id);
        $auction->update(['status' => 'paused']);

        // Desmarcar productos (ya no están en subasta activa)
        $auction->products()->update(['in_auction' => false]);

        return response()->json(['message' => 'Subasta pausada', 'auction' => $auction]);
    }

    /**
     * Reanudar subasta
     */
    public function resume($id)
    {
        $auction = Auction::findOrFail($id);
        $auction->update(['status' => 'active']);

        // Marcar productos como en subasta
        $auction->products()->update(['in_auction' => true]);

        return response()->json(['message' => 'Subasta reanudada', 'auction' => $auction]);
    }

    /**
     * Sincronizar estado con blockchain
     */
    public function syncBlockchain($id)
    {
        $auction = Auction::findOrFail($id);
        $result = $this->auctionService->syncAuction($auction->toArray());
        return response()->json(['message' => 'Sincronizado con blockchain', 'result' => $result]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $auction = Auction::with(['product.sizes', 'bids'])->findOrFail($id);
        return response()->json(['data' => $auction]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $auction = Auction::findOrFail($id);

        $validated = $request->validate([
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date|after:start_at',
            'reserve_price_minor' => 'nullable|integer|min:0',
            'status' => 'sometimes|in:pending,active,completed,cancelled',
            'rules' => 'nullable|json',
        ]);

        $auction->update($validated);

        return response()->json(['data' => $auction]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $auction = Auction::findOrFail($id);

        // Desmarcar productos antes de eliminar
        $auction->products()->update(['in_auction' => false]);

        $auction->delete();

        return response()->json(null, 204);
    }
}

