import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CarritoContext } from "../context/CarritoContext";
import api from '../api/client';
import Swal from "sweetalert2";
import "./Producto.css";

const ListingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setCarrito } = useContext(CarritoContext);
    const [talle, setTalle] = useState("");
    const [detallesMarca, setDetallesMarca] = useState(null);
    const [loadingDetalles, setLoadingDetalles] = useState(false);

    const fetchListing = async (listingId) => {
        const response = await api.get(`/listings/${listingId}`);
        return response.data;
    };

    const { data: listing, error, isLoading } = useQuery({
        queryKey: ["listing", id],
        queryFn: () => fetchListing(id),
    });

    // Cargar detalles de la marca desde la API
    useEffect(() => {
        if (!listing?.product?.brand) return;
        
        const fetchBrandDetails = async () => {
            setLoadingDetalles(true);
            try {
                const response = await api.get(`/detalles/${encodeURIComponent(listing.product.brand)}`);
                setDetallesMarca(response.data.data);
            } catch (err) {
                console.log('No se encontraron detalles para la marca:', listing.product.brand);
                setDetallesMarca(null);
            } finally {
                setLoadingDetalles(false);
            }
        };

        fetchBrandDetails();
    }, [listing?.product?.brand]);

    const handleAgregarCarrito = () => {
        if (product.sizes?.length > 0 && !talle) {
            Swal.fire('Selecciona un talle', 'Por favor elige un talle antes de agregar al carrito', 'warning');
            return;
        }

        const itemCarrito = {
            id: listing.id,
            listingId: listing.id,
            productId: product.id,
            nombre: `${product.brand} ${product.name}`,
            marca: product.brand,
            precio: listing.price_minor / 100,
            currency: listing.currency || 'ARS',
            imagen: product.images?.[0] || '/imagenes/default.png',
            talle: talle || null,
            cantidad: 1,
            tipo: 'listing' // Para diferenciar de productos normales
        };

        setCarrito((prev) => {
            // Verificar si ya existe el mismo producto con el mismo talle
            const existente = prev.find(
                (item) => item.listingId === listing.id && item.talle === talle
            );
            
            if (existente) {
                Swal.fire('Ya en el carrito', 'Este producto ya está en tu carrito', 'info');
                return prev;
            }
            
            Swal.fire({
                icon: 'success',
                title: '¡Agregado!',
                text: `${product.brand} ${product.name} añadido al carrito`,
                timer: 1500,
                showConfirmButton: false
            });
            
            return [...prev, itemCarrito];
        });
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

                    <div className="botones-compra">
                        {product.sizes?.length > 0 ? (
                            <button
                                className={`boton-agregar-carrito boton-grande ${talle ? 'talle-seleccionado' : 'sin-talle'}`}
                                onClick={talle ? handleAgregarCarrito : undefined}
                                disabled={listing.status !== 'active'}
                            >
                                {talle ? '🛒 Agregar al Carrito' : '👆 Seleccione un talle para agregar al carrito'}
                            </button>
                        ) : (
                            <button
                                className="boton-agregar-carrito boton-grande talle-seleccionado"
                                onClick={handleAgregarCarrito}
                                disabled={listing.status !== 'active'}
                            >
                                🛒 Agregar al Carrito
                            </button>
                        )}
                    </div>

                    <div className="producto-descripcion">
                        <h3>Descripción</h3>
                        <p>{product.description || 'No hay descripción disponible.'}</p>

                        {/* Detalles de la marca desde la base de datos */}
                        {loadingDetalles && (
                            <p className="loading-detalles">Cargando información de la marca...</p>
                        )}
                        
                        {detallesMarca && (
                            <div className="producto-detalles-marca">
                                {detallesMarca.descripcion_detallada && (
                                    <h3 className="marca-titulo-descripcion">{detallesMarca.descripcion_detallada}</h3>
                                )}

                                {detallesMarca.actividad_apta && detallesMarca.actividad_apta.length > 0 && (
                                    <div className="marca-seccion">
                                        <h4>🏃 Actividad recomendada</h4>
                                        {detallesMarca.actividad_apta.map((texto, index) => (
                                            <p className="marca-texto" key={`act-${index}`}>
                                                {texto}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {detallesMarca.beneficios_materiales && detallesMarca.beneficios_materiales.length > 0 && (
                                    <div className="marca-seccion">
                                        <h4>🧵 Beneficios y materiales</h4>
                                        {detallesMarca.beneficios_materiales.map((texto, index) => (
                                            <p className="marca-texto" key={`mat-${index}`}>
                                                {texto}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
