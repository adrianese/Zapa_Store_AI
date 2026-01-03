<?php

namespace App\Events;

use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewBidPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public Bid $bid;
    public string $bidderName;
    public int $bidCount;
    public int $timeRemaining;

    /**
     * Create a new event instance.
     */
    public function __construct(Auction $auction, Bid $bid)
    {
        $this->auction = $auction;
        $this->bid = $bid;
        $this->bidderName = $bid->user->name ?? 'Anónimo';
        $this->bidCount = $auction->bids()->count();
        $this->timeRemaining = max(0, $auction->end_at->diffInSeconds(now()));
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
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
        return 'bid.placed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auction->id,
            'current_bid' => $this->auction->current_bid_minor,
            'current_bid_formatted' => number_format($this->auction->current_bid_minor / 100, 2, ',', '.'),
            'highest_bidder' => $this->bidderName,
            'bid_count' => $this->bidCount,
            'bid_amount' => $this->bid->amount_minor,
            'bid_at' => $this->bid->bid_at->toIso8601String(),
            'end_at' => $this->auction->end_at->toIso8601String(),
            'time_remaining' => $this->timeRemaining,
            'was_extended' => $this->auction->wasRecentlyExtended ?? false,
        ];
    }
}
