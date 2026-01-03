import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { getProducts } from '../api/products';
import api from '../api/client';
import MarketplaceABI from '../abi/Marketplace.json';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// TODO: Replace with the actual deployed contract address from an environment variable
const MARKETPLACE_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Example: Hardhat local node address

const CreateListingPage = () => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signer, isConnected, connectWallet } = useWeb3();
    const navigate = useNavigate();

    // 1. Fetch all products to populate the dropdown
    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts().then(res => res.data),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isConnected || !signer) {
            Swal.fire('Wallet Not Connected', 'Please connect your wallet to create a listing.', 'warning');
            connectWallet();
            return;
        }

        if (!selectedProductId || !price) {
            Swal.fire('Missing Information', 'Please select a product and set a price.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // --- STEP 1: Create a 'pending' listing on our backend ---
            console.log('Step 1: Creating pending listing on backend...');
            const priceInMinorUnits = Math.round(parseFloat(price) * 100);
            
            const backendResponse = await api.post('/listings', {
                product_id: selectedProductId,
                price_minor: priceInMinorUnits,
                currency: 'ARS', // Assuming ARS for now
            });
            const pendingListing = backendResponse.data;
            console.log('Pending listing created:', pendingListing);

            // --- STEP 2: Call the smart contract ---
            console.log('Step 2: Calling smart contract...');
            const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MarketplaceABI, signer);
            const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

            const tx = await marketplaceContract.createItem(priceInMinorUnits, selectedProduct.name); // Using product name as externalId for now
            
            console.log('Transaction sent, waiting for confirmation...', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            // Find the ItemCreated event in the transaction logs to get the new marketplace_item_id
            const itemCreatedEvent = receipt.events?.find(event => event.event === 'ItemCreated');
            if (!itemCreatedEvent) {
                throw new Error('ItemCreated event not found in transaction receipt.');
            }
            const marketplaceItemId = itemCreatedEvent.args.id.toString();
            console.log('New Marketplace Item ID:', marketplaceItemId);

            // --- STEP 3: Confirm the listing on our backend ---
            console.log('Step 3: Confirming listing on backend...');
            const confirmResponse = await api.put(`/listings/${pendingListing.id}/confirm`, {
                marketplace_item_id: marketplaceItemId,
                transaction_hash: tx.hash,
            });
            console.log('Listing confirmed on backend:', confirmResponse.data);

            Swal.fire('Success!', 'Your item has been listed on the marketplace.', 'success');
            navigate('/'); // Redirect to homepage after success

        } catch (err) {
            console.error('Failed to create listing:', err);
            const errorMessage = err.reason || err.message || 'An unknown error occurred.';
            setError(`Failed to create listing: ${errorMessage}`);
            Swal.fire('Error', `Failed to create listing: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="contenedor seccion contenido-principal">
            <h1>Create a New Listing</h1>
            <p>List one of your products for sale on the decentralized marketplace.</p>

            <form onSubmit={handleSubmit} className="form-listing">
                <div className="form-group">
                    <label htmlFor="product-select">Product</label>
                    <select
                        id="product-select"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        disabled={isLoadingProducts || isLoading}
                    >
                        <option value="">{isLoadingProducts ? 'Loading products...' : 'Select a product'}</option>
                        {products?.data?.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.brand} - {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="price-input">Price (in ARS)</label>
                    <input
                        id="price-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 150.00"
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="boton-naranja" disabled={isLoading}>
                    {isLoading ? 'Listing...' : 'Create Listing'}
                </button>
            </form>
        </main>
    );
};

export default CreateListingPage;
