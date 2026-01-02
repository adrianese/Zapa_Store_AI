<?php

namespace App\Listeners;

use App\Events\AuctionClosed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use App\Notifications\AuctionClosedNotification;

class SendAuctionClosedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(AuctionClosed $event)
    {
        $auction = $event->auction;
        if ($auction->winner) {
            Notification::send($auction->winner, new AuctionClosedNotification($auction));
        }
    }
}
