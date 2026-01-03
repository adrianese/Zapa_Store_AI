import React, { useState, useEffect, useRef, useCallback } from 'react';
// Utilidad global para formatear precios
const formatPrice = (priceMinor) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(priceMinor / 100);
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBids, getMinBidAmount, placeBid } from '../api/auctions';
import Web3BidPanel from './Web3BidPanel';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import './SubastaCard.css';

const setupWebSocket = () => {
  if (typeof window !== 'undefined' && !window.Echo) {
    window.Pusher = Pusher;
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
      wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
      wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
      wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });
  }
  return window.Echo;
};

const SubastaCard = ({ auction }) => {
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnding, setIsEnding] = useState(false);
  // Eliminado: const [timeExtended, setTimeExtended] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const timerRef = useRef(null);
  const echoRef = useRef(null);

  // Bid history
  const { data: bids = [], refetch: refetchBids } = useQuery({
    queryKey: ['auctionBids', auction.id],
    queryFn: async () => {
      const response = await getBids(auction.id);
      return response.data.data || response.data || [];
    },
    enabled: !!auction.id,
  });

  // Min bid
  const { data: minBidData, refetch: refetchMinBid } = useQuery({
    queryKey: ['minBid', auction.id],
    queryFn: async () => {
      const response = await getMinBidAmount(auction.id);
      return response.data;
    },
    enabled: !!auction.id,
  });

  // Bid mutation
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['auctionBids', auction.id]);
      refetchBids();
      refetchMinBid();
      let message = '¡Tu oferta ha sido registrada exitosamente!';
      if (response.data.time_extended) {
        message += ' El tiempo de la subasta se ha extendido por anti-sniping.';
        // Eliminado: setTimeExtended(true); setTimeout(() => setTimeExtended(false), 5000);
      }
      Swal.fire({
        title: '¡Oferta Realizada!',
        text: message,
        icon: 'success',
        confirmButtonText: 'Genial',
        confirmButtonColor: '#10b981'
      });
      setBidAmount('');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'No se pudo realizar la oferta.';
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });

  // WebSocket
  useEffect(() => {
    if (!auction?.id) return;
    try {
      echoRef.current = setupWebSocket();
      if (echoRef.current) {
        echoRef.current.channel(`auction.${auction.id}`)
          .listen('NewBidPlaced', () => {
            queryClient.invalidateQueries(['auctionBids', auction.id]);
            refetchBids();
            refetchMinBid();
          })
          .listen('AuctionTimeExtended', () => {
            queryClient.invalidateQueries(['auctionBids', auction.id]);
          });
      }
    } catch {
      // fallback
    }
    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`auction.${auction.id}`);
      }
    };
  }, [auction?.id, queryClient, refetchBids, refetchMinBid]);

  // Countdown
  useEffect(() => {
    if (!auction?.end_at) return;
    const updateCountdown = () => {
      const now = new Date();
      const endTime = new Date(auction.end_at);
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsEnding(false);
        return;
      }
      setIsEnding(diff < 5 * 60 * 1000);
      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auction?.end_at]);

  const handleBid = useCallback((e) => {
    e.preventDefault();
    if (!selectedSize) {
      Swal.fire({
        title: 'Selecciona un talle',
        text: 'Debes elegir el talle que deseas antes de ofertar',
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    const bidValue = parseFloat(bidAmount);
    if (!bidAmount || bidValue <= 0) {
      Swal.fire({
        title: 'Monto inválido',
        text: 'Por favor ingresa un monto válido',
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    const bidAmountMinor = Math.round(bidValue * 100);
    const minRequired = minBidData?.min_bid_minor || (auction.current_bid_minor || auction.starting_bid_minor);
    if (bidAmountMinor < minRequired) {
      Swal.fire({
        title: 'Oferta muy baja',
        text: `Tu oferta debe ser al menos ${formatPrice(minRequired)}`,
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    Swal.fire({
      title: '¿Confirmar oferta?',
      html: `
        <p>Vas a ofertar <strong>${formatPrice(bidAmountMinor)}</strong></p>
        <p>Talle: <strong>US ${selectedSize}</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ofertar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        bidMutation.mutate({
          auction_id: auction.id,
          amount_minor: bidAmountMinor,
          size: selectedSize
        });
      }
    });
  }, [bidAmount, selectedSize, auction, minBidData, bidMutation]);



  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString('es-AR');
  };

  const currentBid = auction.current_bid_minor || auction.starting_bid_minor;
  const minBid = minBidData?.min_bid_minor || currentBid;
  const isFinished = timeRemaining.days === 0 && timeRemaining.hours === 0 &&
    timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  return (
    <div className={`subasta-card${isEnding ? ' ending-soon' : ''}${isFinished ? ' finished' : ''}`}>
      <div className="card-image-wrapper">
        <img
          src={auction.product?.images?.[0] || '/imagenes/default.png'}
          alt={auction.product?.name || 'Producto'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/imagenes/default.png';
          }}
        />
        {isEnding && !isFinished && (
          <div className="ending-badge">¡Últimos minutos!</div>
        )}
        {isFinished && (
          <div className="finished-badge">Finalizada</div>
        )}
      </div>
      <div className="card-content">
        <span className="product-brand">{auction.product?.brand || 'Marca'}</span>
        <h2 className="product-name">{auction.product?.name || 'Producto'}</h2>
        <div className="card-bid-info">
          <span className="bid-label">Oferta actual</span>
          <span className="bid-value">{formatPrice(currentBid)}</span>
        </div>
        <div className="card-countdown">
          {isFinished ? (
            <span className="countdown-finished">SUBASTA FINALIZADA</span>
          ) : (
            <>
              <span className="countdown-value">{String(timeRemaining.days).padStart(2, '0')}</span>d :
              <span className="countdown-value">{String(timeRemaining.hours).padStart(2, '0')}</span>h :
              <span className="countdown-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>m :
              <span className="countdown-value">{String(timeRemaining.seconds).padStart(2, '0')}</span>s
            </>
          )}
        </div>
        <button className="btn-toggle-history" onClick={() => setShowBidHistory(!showBidHistory)}>
          {showBidHistory ? '▲ Ocultar historial' : '▼ Ver historial de ofertas'}
        </button>
        {showBidHistory && (
          <div className="bid-history">
            <h4>Últimas ofertas</h4>
            {bids && bids.length > 0 ? (
              <ul className="bid-list">
                {bids.slice(0, 10).map((bid, index) => (
                  <li key={bid.id || index} className={index === 0 ? 'highest-bid' : ''}>
                    <span className="bid-user">
                      {bid.user?.name?.substring(0, 2).toUpperCase() || 'AN'}***
                    </span>
                    <span className="bid-amount">{formatPrice(bid.amount_minor)}</span>
                    <span className="bid-time">{formatTimeAgo(bid.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-bids">Sé el primero en ofertar</p>
            )}
          </div>
        )}
        <form onSubmit={handleBid} className="bid-form">
          <h3>💰 Realiza tu oferta</h3>
          {!isFinished && (
            <>
              <div className="form-group">
                <label htmlFor="size">Talle:</label>
                <select
                  id="size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  required
                >
                  <option value="">Selecciona tu talle</option>
                  {auction.product?.sizes?.map((size) => (
                    <option key={size.size} value={size.size}>
                      US {size.size} {size.stock > 0 ? '' : '(Sin stock)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bidAmount">Tu oferta (ARS):</label>
                <div className="bid-input-wrapper">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={(minBid / 100).toFixed(0)}
                    min={(minBid / 100)}
                    step="100"
                    required
                  />
                </div>
                <span className="min-bid-hint">
                  Mínimo: {formatPrice(minBid)}
                </span>
              </div>
              <button
                type="submit"
                className="btn-ofertar"
                disabled={bidMutation.isPending}
              >
                {bidMutation.isPending ? (
                  <>
                    <span className="spinner-small"></span>
                    Procesando...
                  </>
                ) : (
                  '🔨 Ofertar ahora'
                )}
              </button>
            </>
          )}
          {isFinished && (
            <div className="auction-ended-message">
              <h4>🏆 Subasta finalizada</h4>
              <p>El ganador será notificado por email</p>
            </div>
          )}
        </form>
        <div className="auction-rules">
          <h4>📋 Reglas</h4>
          <ul>
            <li>✓ Cada oferta debe superar el mínimo requerido (5% sobre la actual)</li>
            <li>✓ Sistema anti-sniping: Si ofertas en los últimos 5 minutos, se extiende el tiempo</li>
            <li>✓ El ganador será contactado para completar el pago</li>
            <li>✓ Pago seguro mediante escrow blockchain</li>
          </ul>
        </div>
        <Web3BidPanel
          auctionId={auction.blockchain_auction_id || auction.id}
          onBidPlaced={() => {
            queryClient.invalidateQueries(['auctionBids', auction.id]);
            refetchBids();
            refetchMinBid();
          }}
        />
      </div>
    </div>
  );
};

export default SubastaCard;
