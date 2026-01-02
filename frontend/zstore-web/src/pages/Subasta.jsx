import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAuction, placeBid } from '../api/auctions';
import './Subasta.css';
import Swal from 'sweetalert2';

const Subasta = () => {
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  const { data: auction, isLoading, isError } = useQuery({
    queryKey: ['activeAuction'],
    queryFn: async () => {
      try {
        const response = await getActiveAuction();
        return response.data.data || response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          return null; // No active auction
        }
        throw error; // Re-throw other errors
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(['activeAuction']);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Tu oferta ha sido realizada correctamente.',
        icon: 'success',
        confirmButtonText: 'Genial'
      });
      setBidAmount('');
    },
    onError: (error) => {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo realizar la oferta. Intenta de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });

  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date(auction.end_at);
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('Subasta finalizada');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const handleBid = (e) => {
    e.preventDefault();
    
    if (!selectedSize) {
      Swal.fire('Atención', 'Por favor selecciona un talle', 'warning');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Swal.fire('Atención', 'Por favor ingresa un monto válido', 'warning');
      return;
    }

    const bidAmountMinor = Math.round(parseFloat(bidAmount) * 100);
    const currentBid = auction.current_bid_minor || auction.starting_bid_minor;

    if (bidAmountMinor <= currentBid) {
      Swal.fire('Atención', 'Tu oferta debe ser mayor a la oferta actual', 'warning');
      return;
    }

    bidMutation.mutate({
      auction_id: auction.id,
      amount_minor: bidAmountMinor,
      size: selectedSize
    });
  };

  const formatPrice = (priceMinor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(priceMinor / 100);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando subasta...</p>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="no-auction">
        <h2>No hay subastas activas</h2>
        <p>Vuelve pronto para participar en nuestras próximas subastas</p>
      </div>
    );
  }

  const currentBid = auction.current_bid_minor || auction.starting_bid_minor;

  return (
    <div className="subasta-page">
      <div className="subasta-container">
        <div className="subasta-header">
          <h1>Subasta en Vivo</h1>
          <div className="countdown">
            <span className="countdown-label">Tiempo restante:</span>
            <span className="countdown-time">{timeRemaining}</span>
          </div>
        </div>

        <div className="subasta-content">
          <div className="producto-info-subasta">
            <div className="producto-imagen-grande">
              <img 
                src={auction.product.images?.[0] || '/imagenes/default.png'} 
                alt={auction.product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/imagenes/default.png';
                }}
              />
            </div>
            <div className="producto-detalles">
              <h2>{auction.product.brand}</h2>
              <h3>{auction.product.name}</h3>
              <div className="precio-actual">
                <span className="label">Oferta actual:</span>
                <span className="precio">{formatPrice(currentBid)}</span>
              </div>
              <div className="precio-inicial">
                <span>Precio inicial: {formatPrice(auction.starting_bid_minor)}</span>
              </div>
            </div>
          </div>

          <div className="bid-form-container">
            <form onSubmit={handleBid} className="bid-form">
              <h3>Realiza tu oferta</h3>
              
              <div className="form-group">
                <label htmlFor="size">Selecciona tu talle:</label>
                <select 
                  id="size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona un talle --</option>
                  {auction.product.sizes?.map((size) => (
                    <option key={size.size} value={size.size}>
                      US {size.size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bidAmount">Tu oferta (ARS):</label>
                <input
                  type="number"
                  id="bidAmount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Mínimo: ${formatPrice(currentBid + 100)}`}
                  min={(currentBid / 100) + 1}
                  step="1"
                  required
                />
              </div>

              <button type="submit" className="btn-ofertar" disabled={bidMutation.isPending}>
                {bidMutation.isPending ? 'Ofertando...' : 'Ofertar'}
              </button>
            </form>

            <div className="auction-info">
              <h4>Reglas de la subasta</h4>
              <ul>
                <li>Cada oferta debe superar la oferta actual</li>
                <li>La subasta finaliza en la fecha indicada</li>
                <li>El ganador será notificado por email</li>
                <li>El pago se realiza mediante escrow blockchain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subasta;
