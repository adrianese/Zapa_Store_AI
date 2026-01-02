import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarritoContext } from "../context/CarritoContext";
import Swal from "sweetalert2";
import "./Carrito.css";

const Carrito = () => {
  const { carrito, setCarrito } = useContext(CarritoContext);
  const navigate = useNavigate();

  const total = carrito.reduce(
    (acc, item) => acc + (item.price_minor / 100) * item.cantidad,
    0
  );

  const eliminarDelCarrito = (id, talle) => {
    setCarrito(carrito.filter((p) => !(p.id === id && p.talle === talle)));
  };

  const vaciarCarrito = () => {
    Swal.fire({
      title: "¿Vaciar carrito?",
      text: "Se eliminarán todos los productos",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e08709",
      cancelButtonColor: "#71b100",
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setCarrito([]);
        Swal.fire("Carrito vacío", "", "success");
      }
    });
  };

  const agregarItem = async (item) => {
    const result = await Swal.fire({
      title: "¿Agregar más unidades?",
      text: `${item.brand} ${item.model}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#71b100",
      cancelButtonColor: "#e08709",
      confirmButtonText: "Mismo talle",
      cancelButtonText: "Otro talle",
      showDenyButton: true,
      denyButtonText: "Cancelar",
      denyButtonColor: "#999",
    });

    if (result.isConfirmed) {
      const existe = carrito.find(
        (p) => p.id === item.id && p.talle === item.talle
      );
      if (existe) {
        existe.cantidad += 1;
        setCarrito([...carrito]);
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      const tallesDisponibles = [
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
      ];
      const tallesOptions = {};
      tallesDisponibles.forEach((talle) => {
        tallesOptions[talle] = `Talle ${talle}`;
      });

      const { value: talleSeleccionado } = await Swal.fire({
        title: "Selecciona el talle",
        input: "select",
        inputOptions: tallesOptions,
        inputPlaceholder: "Elige un talle",
        showCancelButton: true,
        confirmButtonColor: "#71b100",
        cancelButtonColor: "#999",
        confirmButtonText: "Agregar",
        cancelButtonText: "Cancelar",
      });

      if (talleSeleccionado) {
        const existe = carrito.find(
          (p) => p.id === item.id && p.talle === talleSeleccionado
        );
        if (existe) {
          existe.cantidad += 1;
          setCarrito([...carrito]);
        } else {
          setCarrito([
            ...carrito,
            { ...item, talle: talleSeleccionado, cantidad: 1 },
          ]);
        }
      }
    }
  };

  const quitarItem = (item) => {
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

  const confirmarCompra = () => {
    navigate("/checkout");
  };

  return (
    <div className="carrito-page">
      <div className="contenedor">
        <h1 className="carrito-titulo">Mi Carrito</h1>

        {carrito.length === 0 ? (
          <div className="carrito-vacio">
            <p>No hay productos en el carrito.</p>
            <Link to="/" className="boton-verde">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="carrito-contenido">
              <ul className="lista-carrito">
                {carrito.map((item, i) => {
                  const imgSrc = (item.images && item.images[0]) 
                    ? item.images[0] 
                    : "/imagenes/default.png";

                  return (
                    <li key={`${item.id}-${item.talle}-${i}`} className="item-carrito">
                      <img
                        src={imgSrc}
                        alt={item.brand}
                        className="miniatura-carrito"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/imagenes/default.png";
                        }}
                      />
                      <div className="detalle-carrito">
                        <div className="info-producto">
                          <h3>
                            {item.brand} {item.model}
                          </h3>
                          <p className="talle-producto">Talle: {item.talle}</p>
                          <p className="precio-unitario">
                            Precio unitario: $
                            {(item.price_minor / 100).toLocaleString("es-AR")}
                          </p>
                        </div>

                        <div className="controles-wrapper">
                          <div className="cantidad-controles">
                            <button
                              className="boton-cantidad"
                              onClick={() => quitarItem(item)}
                            >
                              ➖
                            </button>
                            <span className="cantidad-valor">{item.cantidad}</span>
                            <button
                              className="boton-cantidad"
                              onClick={() => agregarItem(item)}
                            >
                              ➕
                            </button>
                          </div>
                          <button
                            className="boton-eliminar"
                            onClick={() => eliminarDelCarrito(item.id, item.talle)}
                            title="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="precio-subtotal">
                          <p>
                            Subtotal: $
                            {(
                              (item.price_minor / 100) *
                              item.cantidad
                            ).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="carrito-resumen">
                <h2>Resumen del Pedido</h2>
                <div className="resumen-linea">
                  <span>Subtotal:</span>
                  <span>
                    $
                    {total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="resumen-linea">
                  <span>Envío:</span>
                  <span>A calcular</span>
                </div>
                <div className="resumen-total">
                  <span>Total:</span>
                  <span>
                    $
                    {total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="acciones-carrito">
                  <button className="boton-secundario" onClick={vaciarCarrito}>
                    Vaciar Carrito
                  </button>
                  <button className="boton-verde" onClick={confirmarCompra}>
                    Confirmar Compra
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Carrito;
