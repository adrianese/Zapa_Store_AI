import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveAuctionsList } from '../api/auctions';
import SubastaCard from '../components/SubastaCard';
import DigitalClock from '../components/DigitalClock';
import './Subasta.css';
import '../components/SubastaCardsGrid.css';


const Subasta = () => {
  const { data: auctions, isLoading, isError } = useQuery({
    queryKey: ['activeAuctionsList'],
    queryFn: async () => {
      const response = await getActiveAuctionsList();
      return response.data.data || response.data || [];
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando subastas...</p>
      </div>
    );
  }

  if (isError || !auctions || auctions.length === 0) {
    return (
      <div className="no-auction">
        <div className="no-auction-icon">🔨</div>
        <h2>No hay subastas activas</h2>
        <p>Vuelve pronto para participar en nuestras próximas subastas exclusivas</p>
      </div>
    );
  }

  return (
    <div className="subasta-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h1 className="subasta-title">Subastas Activas</h1>
        <DigitalClock />
      </div>
      <div className="subasta-cards-grid">
        {auctions.map((auction) => (
          <SubastaCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  );
};

export default Subasta;
