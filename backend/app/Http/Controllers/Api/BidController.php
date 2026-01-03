<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Events\NewBidPlaced;
use App\Events\AuctionTimeExtended;
use App\Services\AuctionSmartContractServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BidController extends Controller
{
    protected $auctionService;

    // Configuración anti-sniping
    const ANTI_SNIPING_WINDOW = 300; // 5 minutos en segundos
    const ANTI_SNIPING_EXTENSION = 300; // 5 minutos de extensión
    const MIN_BID_INCREMENT_PERCENT = 5; // 5% mínimo de incremento

    public function __construct(AuctionSmartContractServiceInterface $auctionService)
    {
        $this->auctionService = $auctionService;
    }

    /**
     * Listar pujas de una subasta
     */
    public function index(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|exists:auctions,id',
        ]);

        $bids = Bid::where('auction_id', $request->auction_id)
            ->with('user:id,name')
            ->orderBy('bid_at', 'desc')
            ->paginate(20);

        return response()->json($bids);
    }

    /**
     * Obtener la puja mínima requerida
     */
    public function getMinBid(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|exists:auctions,id',
        ]);

        $auction = Auction::findOrFail($request->auction_id);
        $currentBid = $auction->current_bid_minor ?? $auction->starting_bid_minor ?? 0;

        if ($currentBid == 0) {
            $minBid = $auction->starting_bid_minor;
        } else {
            $increment = ($currentBid * self::MIN_BID_INCREMENT_PERCENT) / 100;
            $minBid = $currentBid + $increment;
        }

        return response()->json([
            'current_bid' => $currentBid,
            'min_bid' => (int) $minBid,
            'increment_percent' => self::MIN_BID_INCREMENT_PERCENT,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|exists:auctions,id',
            'amount_minor' => 'required|integer|min:1',
        ]);

        $auction = Auction::findOrFail($request->auction_id);
        $user = Auth::user();

        // Verificar que la subasta está activa
        if ($auction->status !== 'active') {
            return response()->json(['message' => 'La subasta no está activa.'], 400);
        }

        if ($auction->end_at < now()) {
            return response()->json(['message' => 'La subasta ha finalizado.'], 400);
        }

        if ($auction->start_at > now()) {
            return response()->json(['message' => 'La subasta aún no ha comenzado.'], 400);
        }

        // Calcular puja mínima requerida
        $currentBid = $auction->current_bid_minor ?? $auction->starting_bid_minor ?? 0;
        $minBid = $currentBid;

        if ($currentBid > 0) {
            $increment = ($currentBid * self::MIN_BID_INCREMENT_PERCENT) / 100;
            $minBid = $currentBid + $increment;
        } else {
            $minBid = $auction->starting_bid_minor;
        }

        if ($request->amount_minor < $minBid) {
            return response()->json([
                'message' => 'La puja debe ser al menos ' . number_format($minBid / 100, 2) . ' ARS',
                'current_bid' => $currentBid,
                'min_bid' => (int) $minBid,
            ], 422);
        }

        // Verificar que el usuario no sea el vendedor (si aplica)
        // TODO: Agregar verificación cuando haya seller_id en auction

        DB::beginTransaction();
        try {
            // Crear la puja
            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $user->id,
                'amount_minor' => $request->amount_minor,
                'bid_at' => now(),
            ]);

            // Actualizar la subasta
            $wasExtended = false;
            $updateData = [
                'current_bid_minor' => $request->amount_minor,
                'winner_id' => $user->id,
            ];

            // Anti-sniping: extender si queda poco tiempo
            $timeRemaining = $auction->end_at->diffInSeconds(now());
            if ($timeRemaining <= self::ANTI_SNIPING_WINDOW) {
                $newEndAt = now()->addSeconds(self::ANTI_SNIPING_EXTENSION);
                $updateData['end_at'] = $newEndAt;
                $wasExtended = true;

                Log::info("Anti-sniping activated for auction {$auction->id}. Extended to {$newEndAt}");
            }

            $auction->update($updateData);
            $auction->refresh();

            // Marcar si fue extendida para el evento
            $auction->wasRecentlyExtended = $wasExtended;

            DB::commit();

            // Disparar eventos para WebSocket
            event(new NewBidPlaced($auction, $bid));

            if ($wasExtended) {
                event(new AuctionTimeExtended($auction, self::ANTI_SNIPING_EXTENSION));
            }

            return response()->json([
                'success' => true,
                'message' => 'Puja realizada con éxito' . ($wasExtended ? '. ¡Subasta extendida!' : ''),
                'data' => [
                    'bid' => $bid,
                    'current_bid' => $auction->current_bid_minor,
                    'end_at' => $auction->end_at->toIso8601String(),
                    'was_extended' => $wasExtended,
                    'bid_count' => $auction->bids()->count(),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error placing bid: ' . $e->getMessage());
            return response()->json(['message' => 'Error al procesar la puja.'], 500);
        }
    }
}
