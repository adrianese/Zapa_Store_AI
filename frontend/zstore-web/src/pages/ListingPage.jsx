import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CarritoContext } from "../context/CarritoContext";
import api from '../api/client';
import MarketplaceABI from '../abi/Marketplace.json';
import Swal from "sweetalert2";
import "./Producto.css"; // Re-using the same styles for now

// TODO: Replace with the actual deployed contract address from an environment variable
const MARKETPLACE_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Example: Hardhat local node address

const ListingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setCarrito } = useContext(CarritoContext);
    const [talle, setTalle] = useState("");
    const [isBuying, setIsBuying] = useState(false);
    
    const { signer, isConnected, connectWallet } = useWeb3();

    const fetchListing = async (listingId) => {
        const response = await api.get(`/listings/${listingId}`);
        return response.data;
    };

    const { data: listing, error, isLoading } = useQuery({
        queryKey: ["listing", id],
        queryFn: () => fetchListing(id),
    });

    const handleBuyNow = async () => {
        if (!isConnected || !signer) {
            Swal.fire('Wallet Not Connected', 'Please connect your wallet to purchase.', 'warning');
            connectWallet();
            return;
        }

        setIsBuying(true);
        try {
            // Step 1: Call the smart contract to purchase the item
            console.log('Step 1: Calling smart contract to purchase...');
            const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MarketplaceABI, signer);
            
            const tx = await marketplaceContract.purchaseItem(listing.marketplace_item_id, {
                value: listing.price_minor.toString()
            });

            console.log('Transaction sent, waiting for confirmation...', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            if (receipt.status === 0) {
                 throw new Error('Transaction failed.');
            }

            // Step 2: Notify the backend to create the order
            console.log('Step 2: Notifying backend to create order...');
            await api.post('/orders/from-blockchain', {
                marketplace_item_id: listing.marketplace_item_id,
                transaction_hash: tx.hash,
            });

            Swal.fire('Purchase Successful!', 'Your order has been placed.', 'success');
            navigate('/mis-ordenes'); // Redirect to user's orders page

        } catch (err) {
            console.error('Failed to purchase item:', err);
            const errorMessage = err.reason || err.message || 'An unknown error occurred.';
            Swal.fire('Error', `Failed to purchase item: ${errorMessage}`, 'error');
        } finally {
            setIsBuying(false);
        }
    };
    
    if (isLoading) {
        return <main className="contenedor seccion contenido-principal"><div className="loading-message">Cargando...</div></main>;
    }

    if (error || !listing) {
        return (
            <main className="contenedor seccion contenido-principal">
                <div className="error-message">
                    <h2>Listado no encontrado</h2>
                    <button className="boton-verde" onClick={() => navigate("/")}>
                        ← Volver al inicio
                    </button>
                </div>
            </main>
        );
    }

    const { product } = listing;

    const precioFormateado = (listing.price_minor / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: listing.currency || 'ARS',
    });

    const imagenPrincipal = (product.images && product.images.length > 0) ? product.images[0] : "/imagenes/default.png";
    const actividad = product.attributes?.activity || "No especificada";

    return (
        <main className="contenedor seccion contenido-principal">
            <div className="producto-detalle">
                <div className="producto-imagen-gallery">
                    <img
                        src={imagenPrincipal}
                        alt={`${product.brand} ${product.name}`}
                        onError={(e) => { e.target.src = "/imagenes/default.png"; }}
                    />
                </div>
                <div className="producto-info-comprar">
                    <h1>{product.brand?.toUpperCase()}</h1>
                    <h2>{product.name}</h2>
                    <p className="precio">{precioFormateado}</p>

                    <div className="producto-inf">
                        <p><strong>Actividad:</strong> {actividad}</p>
                        <p><strong>Disponibilidad:</strong>{" "}
                            <span className={listing.status === 'active' ? 'texto-verde' : 'texto-rojo'}>
                                {listing.status === 'active' ? "En venta" : "No disponible"}
                            </span>
                        </p>
                    </div>

                    {product.sizes && product.sizes.length > 0 && (
                        <div className="selector-talle">
                            <p className="label-talle">Talles disponibles:</p>
                            <div className="talles-grid">
                                {product.sizes.map((s) => (
                                    <button
                                        key={s.id}
                                        className={`talle-btn ${s.stock === 0 ? 'agotado' : ''} ${talle === s.size ? 'seleccionado' : ''}`}
                                        disabled={s.stock === 0}
                                        onClick={() => setTalle(s.size)}
                                        title={s.stock === 0 ? 'Sin stock' : `${s.stock} disponibles`}
                                    >
                                        {s.size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        className="boton-naranja"
                        onClick={handleBuyNow}
                        disabled={isBuying || listing.status !== 'active'}
                    >
                        {isBuying ? 'Procesando Compra...' : 'Comprar Ahora (On-Chain)'}
                    </button>

                    <div className="producto-descripcion">
                        <h3>Descripción</h3>
                        <p>{product.description || 'No hay descripción disponible.'}</p>
                    </div>
                    <button className="boton-verde" onClick={() => navigate(-1)}>
                        ← Volver
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ListingPage;
