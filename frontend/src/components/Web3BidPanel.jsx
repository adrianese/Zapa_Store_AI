import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuctionContract } from '../hooks/useAuctionContract';
import Swal from 'sweetalert2';
import './Web3BidPanel.css';

/**
 * Web3BidPanel - Panel para ofertas blockchain en subastas
 * 
 * Características:
 * - Sistema anti micro-pujas (muestra mínimo requerido)
 * - Withdraw pattern (retirar fondos pendientes)
 * - IncreaseBid sin penalización para el ganador actual
 * - 1% penalización para postores superados
 */
const Web3BidPanel = ({ auctionId, onBidPlaced }) => {
  const { connectWallet, isConnected, address, error: web3Error } = useWeb3();
  const {
    loading,
    error: contractError,
    getAuction,
    getMinBidInfo,
    getPendingWithdrawals,
    isHighestBidder,
    placeBid,
    increaseBid,
    withdraw,
    formatEth,
    shortAddress,
    contractAddress,
  } = useAuctionContract();

  const [auction, setAuction] = useState(null);
  const [minBidInfo, setMinBidInfo] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState('0');
  const [isTopBidder, setIsTopBidder] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [mode, setMode] = useState('bid'); // 'bid' | 'increase' | 'withdraw'

  // Cargar datos de la subasta
  const loadAuctionData = useCallback(async () => {
    if (!auctionId) return;

    const auctionData = await getAuction(auctionId);
    setAuction(auctionData);

    const bidInfo = await getMinBidInfo(auctionId);
    setMinBidInfo(bidInfo);

    if (isConnected) {
      const pending = await getPendingWithdrawals();
      setPendingWithdrawals(pending);

      const topBidder = await isHighestBidder(auctionId);
      setIsTopBidder(topBidder);
    }
  }, [auctionId, getAuction, getMinBidInfo, getPendingWithdrawals, isHighestBidder, isConnected]);

  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  // Realizar oferta
  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Swal.fire({
        title: 'Monto inválido',
        text: 'Ingresa un monto válido en ETH',
        icon: 'warning',
      });
      return;
    }

    const minRequired = parseFloat(minBidInfo?.minBidRequired || '0');
    if (parseFloat(bidAmount) < minRequired) {
      Swal.fire({
        title: 'Oferta muy baja',
        text: `El mínimo requerido es ${formatEth(minBidInfo.minBidRequired)}`,
        icon: 'warning',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Confirmar oferta blockchain?',
      html: `
        <div style="text-align: left;">
          <p><strong>Monto:</strong> ${bidAmount} ETH</p>
          <p><strong>Desde:</strong> ${shortAddress(address)}</p>
          <p class="swal-warning">⚠️ Si eres superado, recibirás el 99% (1% penalización)</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      const receipt = await placeBid(auctionId, bidAmount);
      if (receipt) {
        Swal.fire({
          title: '¡Oferta registrada!',
          text: `Tx: ${receipt.transactionHash}`,
          icon: 'success',
        });
        setBidAmount('');
        loadAuctionData();
        onBidPlaced?.();
      }
    }
  };

  // Incrementar oferta (sin penalización)
  const handleIncreaseBid = async (e) => {
    e.preventDefault();

    if (!increaseAmount || parseFloat(increaseAmount) <= 0) {
      Swal.fire({
        title: 'Monto inválido',
        text: 'Ingresa un monto válido en ETH',
        icon: 'warning',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Incrementar tu oferta?',
      html: `
        <div style="text-align: left;">
          <p><strong>Adicional:</strong> ${increaseAmount} ETH</p>
          <p><strong>Nueva oferta total:</strong> ${(parseFloat(auction?.currentBid || 0) + parseFloat(increaseAmount)).toFixed(4)} ETH</p>
          <p class="swal-info">✅ Sin penalización por ser el postor actual</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Incrementar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
    });

    if (result.isConfirmed) {
      const receipt = await increaseBid(auctionId, increaseAmount);
      if (receipt) {
        Swal.fire({
          title: '¡Oferta incrementada!',
          text: `Tx: ${receipt.transactionHash}`,
          icon: 'success',
        });
        setIncreaseAmount('');
        loadAuctionData();
        onBidPlaced?.();
      }
    }
  };

  // Retirar fondos pendientes
  const handleWithdraw = async () => {
    if (parseFloat(pendingWithdrawals) <= 0) {
      Swal.fire({
        title: 'Sin fondos',
        text: 'No tienes fondos pendientes para retirar',
        icon: 'info',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Retirar fondos?',
      html: `
        <div style="text-align: left;">
          <p><strong>Monto disponible:</strong> ${formatEth(pendingWithdrawals)}</p>
          <p><strong>A wallet:</strong> ${shortAddress(address)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Retirar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      const receipt = await withdraw();
      if (receipt) {
        Swal.fire({
          title: '¡Fondos retirados!',
          text: `Tx: ${receipt.transactionHash}`,
          icon: 'success',
        });
        loadAuctionData();
      }
    }
  };

  // Si no hay dirección de contrato configurada
  if (!contractAddress) {
    return (
      <div className="web3-bid-panel disabled">
        <div className="panel-header">
          <span className="chain-icon">⛓️</span>
          <h3>Ofertas Blockchain</h3>
        </div>
        <div className="panel-message">
          <p>Contrato no desplegado aún</p>
          <small>Configure VITE_AUCTION_CONTRACT_ADDRESS</small>
        </div>
      </div>
    );
  }

  // Si wallet no conectada
  if (!isConnected) {
    return (
      <div className="web3-bid-panel">
        <div className="panel-header">
          <span className="chain-icon">⛓️</span>
          <h3>Ofertas Blockchain</h3>
        </div>
        <div className="connect-prompt">
          <p>Conecta tu wallet para ofertar con ETH</p>
          <button onClick={connectWallet} className="btn-connect-wallet">
            🦊 Conectar MetaMask
          </button>
          {web3Error && <p className="error-text">{web3Error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="web3-bid-panel">
      <div className="panel-header">
        <span className="chain-icon">⛓️</span>
        <h3>Ofertas Blockchain</h3>
        <span className="wallet-badge">{shortAddress(address)}</span>
      </div>

      {/* Info de subasta */}
      {auction && (
        <div className="auction-info-web3">
          <div className="info-row">
            <span>Oferta actual:</span>
            <strong>{formatEth(auction.currentBid)}</strong>
          </div>
          <div className="info-row">
            <span>Ofertas:</span>
            <strong>{auction.bidCount}</strong>
          </div>
          {isTopBidder && (
            <div className="top-bidder-badge">
              👑 ¡Eres el mejor postor!
            </div>
          )}
        </div>
      )}

      {/* Info anti micro-pujas */}
      {minBidInfo && (
        <div className="min-bid-info">
          <div className="info-header">
            <span className="info-icon">📊</span>
            <span>Requisitos de oferta</span>
          </div>
          <div className="info-details">
            <div className="detail-row">
              <span>Mínimo requerido:</span>
              <strong className="highlight">{formatEth(minBidInfo.minBidRequired)}</strong>
            </div>
            <div className="detail-row small">
              <span>Incremento porcentual (5%):</span>
              <span>{formatEth(minBidInfo.percentIncrement)}</span>
            </div>
            <div className="detail-row small">
              <span>Incremento absoluto:</span>
              <span>{formatEth(minBidInfo.absoluteIncrement)}</span>
            </div>
            <div className="anti-micropuja-note">
              💡 Se usa el mayor entre porcentual y absoluto
            </div>
          </div>
        </div>
      )}

      {/* Fondos pendientes */}
      {parseFloat(pendingWithdrawals) > 0 && (
        <div className="pending-withdrawals">
          <div className="pending-header">
            <span className="pending-icon">💰</span>
            <span>Fondos disponibles</span>
          </div>
          <div className="pending-amount">
            <strong>{formatEth(pendingWithdrawals)}</strong>
            <button 
              onClick={handleWithdraw} 
              className="btn-withdraw"
              disabled={loading}
            >
              {loading ? '...' : 'Retirar'}
            </button>
          </div>
          <small className="penalty-note">* Ya incluye 1% de penalización por ser superado</small>
        </div>
      )}

      {/* Tabs de modo */}
      <div className="mode-tabs">
        <button 
          className={`tab ${mode === 'bid' ? 'active' : ''}`}
          onClick={() => setMode('bid')}
          disabled={isTopBidder}
        >
          Nueva Oferta
        </button>
        {isTopBidder && (
          <button 
            className={`tab ${mode === 'increase' ? 'active' : ''}`}
            onClick={() => setMode('increase')}
          >
            Incrementar
          </button>
        )}
      </div>

      {/* Formulario de oferta */}
      {mode === 'bid' && !isTopBidder && (
        <form onSubmit={handlePlaceBid} className="bid-form-web3">
          <div className="input-group">
            <input
              type="number"
              step="0.001"
              min="0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBidInfo?.minBidRequired || '0.01'}
              disabled={loading}
            />
            <span className="input-suffix">ETH</span>
          </div>
          <button type="submit" className="btn-bid" disabled={loading}>
            {loading ? (
              <span className="loading-text">Procesando...</span>
            ) : (
              '🔨 Ofertar con ETH'
            )}
          </button>
        </form>
      )}

      {/* Formulario de incremento */}
      {mode === 'increase' && isTopBidder && (
        <form onSubmit={handleIncreaseBid} className="increase-form-web3">
          <p className="increase-info">
            Incrementa tu oferta sin penalización
          </p>
          <div className="input-group">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={increaseAmount}
              onChange={(e) => setIncreaseAmount(e.target.value)}
              placeholder="0.01"
              disabled={loading}
            />
            <span className="input-suffix">ETH</span>
          </div>
          <button type="submit" className="btn-increase" disabled={loading}>
            {loading ? (
              <span className="loading-text">Procesando...</span>
            ) : (
              '⬆️ Incrementar Oferta'
            )}
          </button>
        </form>
      )}

      {/* Errores */}
      {contractError && (
        <div className="error-message">
          ❌ {contractError}
        </div>
      )}

      {/* Info del sistema */}
      <div className="system-info">
        <details>
          <summary>ℹ️ ¿Cómo funciona?</summary>
          <ul>
            <li>Las ofertas se registran en blockchain (Ethereum)</li>
            <li>Mínimo requerido: MAX(5% actual, 0.005 ETH)</li>
            <li>Si te superan: 99% va a fondos retirables, 1% penalización</li>
            <li>Si eres el mejor postor, puedes incrementar sin penalización</li>
            <li>Retira tus fondos en cualquier momento</li>
          </ul>
        </details>
      </div>
    </div>
  );
};

export default Web3BidPanel;
