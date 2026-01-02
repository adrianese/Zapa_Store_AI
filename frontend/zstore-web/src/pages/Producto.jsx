import React, { useState, useContext, useEffect } from "react";
  const [detallesMarca, setDetallesMarca] = useState(null);

  useEffect(() => {
    if (!brand) return;
    fetch('/detalles.json')
      .then(res => res.json())
      .then(data => {
        // Normalizar marcas para comparar sin importar mayúsculas/minúsculas ni espacios
        const normalizar = (str) => str ? str.trim().toLowerCase().replace(/\s+/g, '') : '';
        const marcaProd = normalizar(brand);
        const detalles = data.productos_deportivos.find(
          (d) => normalizar(d.marca) === marcaProd
        );
        setDetallesMarca(detalles || null);
      });
  }, [brand]);
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/products";
import { CarritoContext } from "../context/CarritoContext";
import Swal from "sweetalert2";
import "./Producto.css";

function Producto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { carrito, setCarrito } = useContext(CarritoContext);
  const [talle, setTalle] = useState("");

  const { data: producto, error, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id).then(res => res.data.data || res.data),
  });

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
          <p><strong>Talles disponibles:</strong> {sizes && sizes.length > 0 ? sizes.map((s) => s.size).join(", ") : "No hay talles registrados"}</p>
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
            {detallesMarca && (
              <div className="producto-detalles-extra">
                <p>
                  <strong>Actividad más recomendada</strong>
                </p>
                {detallesMarca.actividad_apta.map((texto, index) => (
                  <p className="p-producto" key={`act-${index}`}>
                    {texto}
                  </p>
                ))}
                <p>
                  <strong>Beneficios y materiales</strong>
                </p>
                {detallesMarca.beneficios_materiales.map((texto, index) => (
                  <p className="p-producto" key={`mat-${index}`}>
                    {texto}
                  </p>
                ))}
              </div>
            )}
            <button
              className="boton-verde"
              onClick={() => navigate(-1)}
            >
              ← Volver a productos
            </button>
          </div>
        </div>
      </div>
  </main>
    </main>
  );
}

export default Producto;
