<?php

namespace App\Events;

use App\Models\Auction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionTimeExtended implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public int $extensionSeconds;

    /**
     * Create a new event instance.
     */
    public function __construct(Auction $auction, int $extensionSeconds = 300)
    {
        $this->auction = $auction;
        $this->extensionSeconds = $extensionSeconds;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('auction.' . $this->auction->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'auction.extended';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auction->id,
            'new_end_at' => $this->auction->end_at->toIso8601String(),
            'extension_seconds' => $this->extensionSeconds,
            'time_remaining' => max(0, $this->auction->end_at->diffInSeconds(now())),
            'message' => '¡Subasta extendida por una puja de último momento!',
        ];
    }
}
