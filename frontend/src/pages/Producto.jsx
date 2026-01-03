import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/products";
import { CarritoContext } from "../context/CarritoContext";
import { api } from "../api/client";
import Swal from "sweetalert2";
import "./Producto.css";

function Producto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { carrito, setCarrito } = useContext(CarritoContext);
  const [talle, setTalle] = useState("");
  const [detallesMarca, setDetallesMarca] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  const { data: producto, error, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id).then(res => res.data.data || res.data),
  });

  // Cargar detalles de la marca desde la API
  useEffect(() => {
    if (!producto?.brand) return;
    
    const fetchBrandDetails = async () => {
      setLoadingDetalles(true);
      try {
        const response = await api.get(`/brand-details/by-brand/${encodeURIComponent(producto.brand)}`);
        setDetallesMarca(response.data);
      } catch (err) {
        // Si no hay detalles para esta marca, no es un error crítico
        console.log('No se encontraron detalles para la marca:', producto.brand);
        setDetallesMarca(null);
      } finally {
        setLoadingDetalles(false);
      }
    };

    fetchBrandDetails();
  }, [producto?.brand]);

  const agregarAlCarrito = () => {
    if (!producto.available) {
      Swal.fire({ icon: "error", title: "Producto no disponible" });
      return;
    }

    if (!talle) {
      Swal.fire({ icon: "warning", title: "Talle requerido", text: "Seleccioná un talle." });
      return;
    }

    const existe = carrito.find(p => p.id === producto.id && p.talle === talle);
    if (existe) {
      Swal.fire({ icon: "info", title: "Ya agregado", text: `Este producto ya está en el carrito.` });
      return;
    }

    setCarrito([...carrito, { ...producto, talle, cantidad: 1 }]);
    Swal.fire({ icon: "success", title: "¡Agregado!", text: `${producto.name} (talle ${talle}) fue agregado al carrito.` });
  };

  if (isLoading) {
    return (
      <main className="contenedor seccion contenido-principal">
        <div className="loading-message">Cargando producto...</div>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main className="contenedor seccion contenido-principal">
        <div className="error-message">
          <h2>Producto no encontrado</h2>
          <button className="boton-verde" onClick={() => navigate("/")}>
            ← Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  const { brand, name, description, price_minor, currency, images, attributes, available, sizes } = producto;
  
  const precioFormateado = (price_minor / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: currency || 'ARS',
  });

  // Permitir rutas relativas y absolutas para imágenes
  let imagenPrincipal = "/imagenes/default.png";
  if (images && images.length > 0) {
    if (images[0].startsWith("/uploads/")) {
      imagenPrincipal = images[0];
    } else if (images[0].startsWith("http")) {
      imagenPrincipal = images[0];
    } else {
      imagenPrincipal = `/uploads/productos/${images[0]}`;
    }
  }
  const actividad = attributes?.activity || "No especificada";

  return (
    <main className="contenedor seccion contenido-principal">
      <div className="producto-detalle">
        <div className="producto-info">
          <h1>{brand?.toUpperCase()}</h1>
          <h2>{name}</h2>
          <p className="precio">{precioFormateado}</p>
          <p><strong>Actividad:</strong> {actividad}</p>
          <p><strong>Disponibilidad:</strong> {available ? <span className="texto-verde">En stock</span> : <span className="texto-rojo">Agotado</span>}</p>
          
          {sizes && sizes.length > 0 && (
            <div className="selector-talle">
              <p className="label-talle"><strong>Talles disponibles:</strong></p>
              <div className="talles-grid">
                {sizes.map((s) => (
                  <button
                    key={s.id || s.size}
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
            className="boton-naranja boton-agregar-carrito"
            onClick={agregarAlCarrito}
            disabled={!available}
          >
            🛒 Agregar al carrito
          </button>
        </div>

        <div className="producto-contenido">
          <div className="producto-imagen">
            <img 
              src={imagenPrincipal}
              alt={`${brand} ${name}`}
              onError={(e) => { e.target.src = "/imagenes/default.png"; }}
            />
          </div>
          
          <div className="producto-descripcion">
            <h3>Descripción</h3>
            <p>{description || 'No hay descripción disponible.'}</p>

            {/* Detalles de la marca desde la base de datos */}
            {loadingDetalles && (
              <p className="loading-detalles">Cargando información de la marca...</p>
            )}
            
            {detallesMarca && (
              <div className="producto-detalles-marca">
                <div className="marca-header">
                  <h3>✨ Sobre {detallesMarca.marca}</h3>
                </div>

                {detallesMarca.descripcion_detallada && (
                  <p className="marca-descripcion">{detallesMarca.descripcion_detallada}</p>
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

            <button
              className="boton-verde boton-volver"
              onClick={() => navigate(-1)}
            >
              ← Volver a productos
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Producto;
