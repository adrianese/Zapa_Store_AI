import React, { useState } from 'react';
import api from '../api/client';
import './SeguimientoEnvio.css';

const SeguimientoEnvio = () => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            setError('Please enter a tracking number.');
            return;
        }

        setIsLoading(true);
        setShipment(null);
        setError(null);

        try {
            const response = await api.get(`/shipments/track/${trackingNumber}`);
            setShipment(response.data.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Tracking number not found. Please check the number and try again.');
            } else {
                setError('An error occurred while fetching the shipment status.');
            }
            console.error('Shipment tracking error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="seguimiento-container">
            <h1>Track Your Shipment</h1>
            <p className="seguimiento-subtitle">Enter your tracking number below to see the status of your delivery.</p>
            
            <form onSubmit={handleSearch} className="seguimiento-form">
                <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., ZS-12345ABC"
                    className="seguimiento-input"
                />
                <button type="submit" disabled={isLoading} className="seguimiento-button">
                    {isLoading ? 'Searching...' : 'Track'}
                </button>
            </form>

            {error && <div className="seguimiento-error">{error}</div>}

            {shipment && (
                <div className="shipment-details">
                    <h2>Shipment Details for #{shipment.tracking_number}</h2>
                    <div className="status-card">
                        <p><strong>Status:</strong> <span className={`status-label status-${shipment.status}`}>{shipment.status}</span></p>
                        <p><strong>Carrier:</strong> {shipment.carrier || 'N/A'}</p>
                        <p><strong>Last Updated:</strong> {new Date(shipment.updated_at).toLocaleString()}</p>
                    </div>
                    
                    <h4>Shipping Address</h4>
                    <div className="address-card">
                        <p>{shipment.address.full_name}</p>
                        <p>{shipment.address.street}</p>
                        <p>{shipment.address.city}, {shipment.address.province}, {shipment.address.postal_code}</p>
                        <p>{shipment.address.country}</p>
                    </div>

                    {shipment.history && shipment.history.length > 0 && (
                        <div className="history-section">
                            <h4>Shipment History</h4>
                            <ul className="timeline">
                                {shipment.history.map((event, index) => (
                                    <li key={index} className="timeline-item">
                                        <div className="timeline-date">{new Date(event.timestamp).toLocaleString()}</div>
                                        <div className="timeline-content">
                                            <h5>{event.status}</h5>
                                            <p>{event.location}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SeguimientoEnvio;
