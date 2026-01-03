<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    protected Order $order;
    protected string $previousStatus;
    protected string $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order, string $previousStatus, string $newStatus)
    {
        $this->order = $order;
        $this->previousStatus = $previousStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusLabels = [
            'pending' => 'Pendiente',
            'paid' => 'Pagado',
            'processing' => 'En Proceso',
            'shipped' => 'Enviado',
            'delivered' => 'Entregado',
            'cancelled' => 'Cancelado',
        ];

        $newStatusLabel = $statusLabels[$this->newStatus] ?? $this->newStatus;
        $previousStatusLabel = $statusLabels[$this->previousStatus] ?? $this->previousStatus;

        $message = (new MailMessage)
            ->subject("Tu pedido #{$this->order->id} - Estado actualizado: {$newStatusLabel}")
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("Te informamos que el estado de tu pedido ha sido actualizado.");

        // Personalizar mensaje según el nuevo estado
        switch ($this->newStatus) {
            case 'paid':
                $message->line("Tu pago ha sido confirmado. Procederemos a preparar tu pedido.");
                break;
            case 'processing':
                $message->line("Estamos preparando tu pedido con mucho cuidado.");
                break;
            case 'shipped':
                $message->line("¡Tu pedido está en camino!");
                if ($this->order->tracking_number) {
                    $message->line("**Número de seguimiento:** {$this->order->tracking_number}");
                    if ($this->order->tracking_carrier) {
                        $message->line("**Transportista:** {$this->order->tracking_carrier}");
                    }
                    if ($this->order->tracking_url) {
                        $message->action('Rastrear mi pedido', $this->order->tracking_url);
                    }
                }
                break;
            case 'delivered':
                $message->line("¡Tu pedido ha sido entregado! Esperamos que disfrutes tu compra.");
                $message->line("Si tienes algún inconveniente, no dudes en contactarnos.");
                break;
            case 'cancelled':
                $message->line("Lamentamos informarte que tu pedido ha sido cancelado.");
                $message->line("Si no solicitaste esta cancelación, por favor contáctanos.");
                break;
        }

        $message->line("**Resumen del pedido:**")
            ->line("- Pedido #: {$this->order->id}")
            ->line("- Estado anterior: {$previousStatusLabel}")
            ->line("- Nuevo estado: {$newStatusLabel}")
            ->line("- Total: $" . number_format($this->order->total, 2));

        // Si hay productos
        if ($this->order->items && $this->order->items->count() > 0) {
            $message->line("")->line("**Productos:**");
            foreach ($this->order->items->take(5) as $item) {
                $productName = $item->product_snapshot['nombre'] ?? 'Producto';
                $message->line("- {$productName} x{$item->quantity}");
            }
            if ($this->order->items->count() > 5) {
                $remaining = $this->order->items->count() - 5;
                $message->line("... y {$remaining} producto(s) más");
            }
        }

        return $message
            ->action('Ver mi pedido', url("/cuenta/pedidos/{$this->order->id}"))
            ->line('¡Gracias por comprar en ZStore!')
            ->salutation('Saludos, El equipo de ZStore');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'previous_status' => $this->previousStatus,
            'new_status' => $this->newStatus,
            'total' => $this->order->total,
            'message' => $this->getNotificationMessage(),
            'tracking_number' => $this->order->tracking_number,
            'tracking_carrier' => $this->order->tracking_carrier,
        ];
    }

    /**
     * Get a short notification message based on the new status.
     */
    protected function getNotificationMessage(): string
    {
        $messages = [
            'paid' => "Tu pedido #{$this->order->id} ha sido pagado",
            'processing' => "Tu pedido #{$this->order->id} está siendo preparado",
            'shipped' => "Tu pedido #{$this->order->id} ha sido enviado",
            'delivered' => "Tu pedido #{$this->order->id} ha sido entregado",
            'cancelled' => "Tu pedido #{$this->order->id} ha sido cancelado",
        ];

        return $messages[$this->newStatus] ?? "Tu pedido #{$this->order->id} ha cambiado de estado";
    }
}
