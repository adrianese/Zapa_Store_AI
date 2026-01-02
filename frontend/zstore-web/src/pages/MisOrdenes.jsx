import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import api from '../api/client';
import { useWeb3 } from '../context/Web3Context';
import MarketplaceABI from '../abi/Marketplace.json';
import Swal from 'sweetalert2';
import './MisOrdenes.css';

// TODO: Replace with the actual deployed contract address from an environment variable
const MARKETPLACE_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const MisOrdenes = () => {
    const { user, signer, isConnected, connectWallet } = useWeb3();
    const queryClient = useQueryClient();
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const fetchOrders = async () => {
        const response = await api.get('/orders');
        return response.data.data; // Assuming pagination
    };

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['orders', user?.id],
        queryFn: fetchOrders,
        enabled: !!user,
    });
    
    const updateOrderStatus = async ({ orderId, status }) => {
        const response = await api.put(`/orders/${orderId}/status`, { status });
        return response.data;
    };

    const mutation = useMutation({
        mutationFn: updateOrderStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
        },
    });

    const handleContractAction = async (order, action) => {
        if (!isConnected || !signer) {
            Swal.fire('Wallet Not Connected', 'Please connect your wallet.', 'warning');
            connectWallet();
            return;
        }
        
        const marketplaceItemId = order.listing?.marketplace_item_id;
        if (!marketplaceItemId) {
            Swal.fire('Error', 'Marketplace item ID not found for this order.', 'error');
            return;
        }

        setProcessingOrderId(order.id);
        try {
            const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MarketplaceABI, signer);
            let tx;
            
            if (action === 'confirm') {
                tx = await marketplaceContract.confirmReception(marketplaceItemId);
            } else if (action === 'dispute') {
                tx = await marketplaceContract.raiseDispute(marketplaceItemId);
            } else {
                throw new Error('Invalid action');
            }
            
            await tx.wait();

            const newStatus = action === 'confirm' ? 'delivered' : 'in_dispute';
            mutation.mutate({ orderId: order.id, status: newStatus });

            Swal.fire('Success', `Action completed successfully. Order is now ${newStatus}.`, 'success');

        } catch (err) {
            console.error('Contract action failed:', err);
            const errorMessage = err.reason || err.message || 'An unknown error occurred.';
            Swal.fire('Error', `Action failed: ${errorMessage}`, 'error');
        } finally {
            setProcessingOrderId(null);
        }
    };

    if (isLoading) {
        return <div className="mis-ordenes-container"><h2>Loading your orders...</h2></div>;
    }

    if (error) {
        return <div className="mis-ordenes-container"><h2>Error</h2><p>Failed to fetch orders. Please try again later.</p></div>;
    }

    return (
        <div className="mis-ordenes-container">
            <h1>My Orders</h1>
            {!user && <p>Please log in to see your orders.</p>}
            {user && orders?.length === 0 && (
                <p>You have not placed any orders yet.</p>
            )}
            {user && orders?.length > 0 && (
                <ul className="orders-list">
                    {orders.map(order => (
                        <li key={order.id} className="order-item">
                            <div className="order-header">
                                <h3>Order #{order.order_number}</h3>
                                <span className={`order-status status-${order.status}`}>{order.status.replace('_', ' ')}</span>
                            </div>
                            <div className="order-details">
                                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                                <p><strong>Total:</strong> ${(order.total_minor / 100).toFixed(2)} {order.currency}</p>
                            </div>
                            <div className="order-items-summary">
                                <h4>Items:</h4>
                                <ul>
                                    {order.items.map((item, index) => (
                                        <li key={index}>{item.name} (x{item.quantity})</li>
                                    ))}
                                </ul>
                            </div>
                            {order.status === 'paid_on_chain' && (
                                <div className="order-actions">
                                    <button
                                        className="boton-verde"
                                        onClick={() => handleContractAction(order, 'confirm')}
                                        disabled={processingOrderId === order.id}
                                    >
                                        {processingOrderId === order.id ? 'Processing...' : 'Confirm Reception'}
                                    </button>
                                    <button
                                        className="boton-rojo"
                                        onClick={() => handleContractAction(order, 'dispute')}
                                        disabled={processingOrderId === order.id}
                                    >
                                        {processingOrderId === order.id ? 'Processing...' : 'Raise Dispute'}
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MisOrdenes;
