import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./CarritoModal.css";

const CarritoModal = ({
  carrito,
  setCarrito,
  onEliminar,
  onVaciar,
  onCerrar,
  onConfirmar,
}) => {
  const [visible, setVisible] = useState(false);
  const total = carrito.reduce(
    (acc, item) => acc + (item.price_minor / 100) * item.cantidad,
    0
  );

  useEffect(() => {
    setVisible(true);
  }, []);

  const agregarItem = async (item) => {
    const result = await Swal.fire({
      title: '¿Agregar más unidades?',
      text: `${item.brand} ${item.model}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#71b100',
      cancelButtonColor: '#e08709',
      confirmButtonText: 'Mismo talle',
      cancelButtonText: 'Otro talle',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      denyButtonColor: '#999'
    });

    if (result.isConfirmed) {
      // Agregar mismo talle
      const existe = carrito.find(
        (p) => p.id === item.id && p.talle === item.talle
      );
      if (existe) {
        existe.cantidad += 1;
        setCarrito([...carrito]);
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Mostrar dropdown con talles
      const tallesDisponibles = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
      const tallesOptions = {};
      tallesDisponibles.forEach(talle => {
        tallesOptions[talle] = `Talle ${talle}`;
      });

      const { value: talleSeleccionado } = await Swal.fire({
        title: 'Selecciona el talle',
        input: 'select',
        inputOptions: tallesOptions,
        inputPlaceholder: 'Elige un talle',
        showCancelButton: true,
        confirmButtonColor: '#71b100',
        cancelButtonColor: '#999',
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar'
      });

      if (talleSeleccionado) {
        const existe = carrito.find(
          (p) => p.id === item.id && p.talle === talleSeleccionado
        );
        if (existe) {
          existe.cantidad += 1;
          setCarrito([...carrito]);
        } else {
          setCarrito([...carrito, { ...item, talle: talleSeleccionado, cantidad: 1 }]);
        }
      }
    }
  };

  const quitarItem = async (item) => {
    const index = carrito.findIndex(
      (p) => p.id === item.id && p.talle === item.talle
    );
    if (index !== -1) {
      const nuevoCarrito = [...carrito];
      if (nuevoCarrito[index].cantidad > 1) {
        nuevoCarrito[index].cantidad -= 1;
        setCarrito(nuevoCarrito);
      } else {
        nuevoCarrito.splice(index, 1);
        setCarrito(nuevoCarrito);
      }
    }
  };

  return (
    <div
      className={`modal-carrito-overlay ${visible ? "fade-in" : "fade-out"}`}
    >
      <div
        className={`modal-carrito-contenido ${
          visible ? "slide-in" : "slide-out"
        }`}
      >
        <button className="cerrar-modal" onClick={onCerrar}>
          ×
        </button>
        <h2>Resumen del Carrito</h2>

        {carrito.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <>
            <ul className="lista-carrito">
              {carrito.map((item, i) => {
                const imgSrc = (item.images && item.images[0]) 
                  ? item.images[0] 
                  : "/imagenes/default.png";
                return (
                  <li key={`${item.id}-${item.talle}`} className="item-carrito">
                    <img
                      src={imgSrc}
                      alt={item.brand}
                      className="miniatura-carrito"
                      title={`Modelo: ${item.model}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/imagenes/default.png";
                      }}
                    />
                    <div className="detalle-carrito-linea">
                      <span className="marca-modelo">
                        <strong>{i + 1}.</strong> {item.brand} {item.model}
                      </span>
                      <span className="precio-item">
                        ${(item.price_minor / 100).toLocaleString("es-AR")}
                      </span>
                      <span className="talle-item">Talle: {item.talle}</span>
                      <span className="cantidad-item">
                        Cantidad: {item.cantidad}
                      </span>

                      <div className="acciones-item">
                        <button
                          className="boton-cantidad"
                          onClick={() => agregarItem(item)}
                        >
                          ➕
                        </button>
                        <button
                          className="boton-cantidad"
                          onClick={() => quitarItem(item)}
                        >
                          ➖
                        </button>
                      </div>
                    </div>
                    <button
                      className="boton-eliminar"
                      onClick={() => onEliminar(item.id, item.talle)}
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="total-carrito">
              <strong>Total:</strong>{" "}
              <span className="precio-total">
                ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </p>

            <div className="acciones-carrito">
              <button className="boton-verde" onClick={onVaciar}>
                Vaciar Carrito
              </button>
              <button className="boton-naranja" onClick={onConfirmar}>
                Confirmar Compra
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CarritoModal;
