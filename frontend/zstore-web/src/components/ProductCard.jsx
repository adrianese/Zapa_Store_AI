import React, { useState, useContext } from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import { CarritoContext } from "../context/CarritoContext";
import CarritoModal from "./CarritoModal";
import Swal from "sweetalert2";
import "./ProductCard.css";

const ProductCard = ({ listing }) => {
  const { product } = listing;
  const [talle, setTalle] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const { carrito, setCarrito } = useContext(CarritoContext);
  
  const formatPrice = (priceMinor, currency = 'ARS') => {
    const price = priceMinor / 100;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getFirstImage = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return '/imagenes/default.png';
  };

  const agregarAlCarrito = () => {
    if (!product.available) {
      Swal.fire({
        icon: "error",
        title: "Producto no disponible",
        text: "Este producto no está disponible.",
      });
      return;
    }

    if (!talle) {
      Swal.fire({
        icon: "warning",
        title: "Talle requerido",
        text: "Seleccioná un talle antes de agregar al carrito.",
      });
      return;
    }

    const existe = carrito.find(
      (p) => p.id === product.id && p.talle === talle
    );

    if (existe) {
      Swal.fire({
        icon: "info",
        title: "Ya agregado",
        text: `Este producto en talle ${talle} ya está en el carrito.`,
      });
      return;
    }

    setCarrito([...carrito, { ...product, talle, cantidad: 1, listing_id: listing.id }]);
    
    setMostrarModal(true);
    setTimeout(() => {
      setMostrarModal(false);
    }, 5000);
    
    setTalle("");
  };

  return (
    <div className="producto-card">
      <div className="producto-imagen">
        <img 
          src={getFirstImage()} 
          alt={`${product.brand} ${product.name}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/imagenes/default.png';
          }}
        />
        {product.is_featured && (
          <span className="badge-featured">Destacado</span>
        )}
      </div>

      <div className="producto-contenido">
        <h2 className="producto-marca">{product.brand?.toUpperCase()}</h2>
        <p className="producto-modelo">{product.name}</p>
        <p className="producto-precio">{formatPrice(listing.price_minor, listing.currency)}</p>

        <div className="producto-info">
          {product.attributes?.activity && (
            <div className="producto-actividad">
              <img
                src={`/imagenes/${product.attributes.activity}.svg`}
                alt={product.attributes.activity}
                title={product.attributes.activity}
                className="icono-actividad"
              />
              <p>{product.attributes.activity}</p>
            </div>
          )}
          <div className="producto-disponibilidad">
            <span className={`badge ${product.available ? 'disponible' : 'agotado'}`}>
              {product.available ? '✓ Disponible' : '✗ Agotado'}
            </span>
          </div>
        </div>

        <Link
          to={`/listing/${listing.id}`}
          className="btn-detalle"
        >
          Ver Detalles
        </Link>

        {product.sizes && product.sizes.length > 0 && (
          <div className="selector-talle">
            <p className="label-talle">Talles disponibles:</p>
            <div className="talles-grid">
              {product.sizes.map((s) => {
                const stockNum = parseInt(s.stock) || 0;
                const clases = ["talle-btn"];
                let tooltip = "";

                if (stockNum === 0) {
                  clases.push("agotado");
                  tooltip = "Sin stock";
                } else if (stockNum === 1) {
                  clases.push("unico");
                  tooltip = "Último disponible";
                } else if (stockNum > 1) {
                  clases.push("disponible");
                }

                if (talle === s.size) {
                  clases.push("seleccionado");
                }

                return (
                  <button
                    key={s.id}
                    className={clases.join(" ")}
                    disabled={stockNum === 0}
                    onClick={() => setTalle(s.size)}
                    title={tooltip}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          className="boton-naranja"
          onClick={agregarAlCarrito}
          disabled={!product.available}
        >
          Comprar
        </button>
      </div>

      {mostrarModal && ReactDOM.createPortal(
        <CarritoModal
          carrito={carrito}
          setCarrito={setCarrito}
          onEliminar={(id, talle) => setCarrito(carrito.filter((p) => !(p.id === id && p.talle === talle)))}
          onVaciar={() => setCarrito([])}
          onCerrar={() => setMostrarModal(false)}
          onConfirmar={() => setMostrarModal(false)}
        />,
        document.body
      )}
    </div>
  );
};

export default ProductCard;
