<?php

namespace App\Notifications;

use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AuctionClosedNotification extends Notification
{
    use Queueable;

    protected $auction;

    public function __construct(Auction $auction)
    {
        $this->auction = $auction;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('¡Felicidades! Has ganado la subasta')
            ->greeting('Hola ' . $notifiable->name)
            ->line('Has ganado la subasta #' . $this->auction->id . '.')
            ->action('Ver subasta', url('/auctions/' . $this->auction->id))
            ->line('Gracias por participar en ZStore!');
    }
}
