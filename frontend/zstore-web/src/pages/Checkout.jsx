import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CarritoContext } from "../context/CarritoContext";
import { api } from "../api/client";
import Swal from "sweetalert2";
import "./Checkout.css";

const Checkout = () => {
  const { carrito, setCarrito } = useContext(CarritoContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: envío, 2: pago, 3: confirmación
  const [loading, setLoading] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  
  const [shippingData, setShippingData] = useState({
    full_name: "",
    street: "",
    city: "",
    province: "Buenos Aires",
    postal_code: "",
    country: "Argentina",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card"); // card, cash, transfer

  const provinces = [
    "CABA",
    "Buenos Aires",
    "Córdoba",
    "Santa Fe",
    "Mendoza",
    "Tucumán",
    "Entre Ríos",
    "Salta",
    "Misiones",
    "Chaco",
    "Corrientes",
    "Santiago del Estero",
    "San Juan",
    "Jujuy",
    "Río Negro",
    "Neuquén",
    "Formosa",
    "Chubut",
    "San Luis",
    "Catamarca",
    "La Rioja",
    "La Pampa",
    "Santa Cruz",
    "Tierra del Fuego",
  ];

  // Calcular totales
  // En Argentina el precio final ya incluye IVA, lo descomponemos para mostrar
  const precioFinal = carrito.reduce(
    (acc, item) => acc + (item.price_minor / 100) * item.cantidad,
    0
  );
  
  // Precio neto = Precio final / 1.21 (el IVA ya está incluido)
  const subtotal = precioFinal / 1.21;
  const tax = precioFinal - subtotal; // IVA implícito en el precio
  const shippingCost = selectedShipping ? selectedShipping.price_minor / 100 : 0;
  const total = precioFinal + shippingCost; // El precio ya incluye IVA

  // Obtener cotizaciones de envío
  const fetchShippingQuotes = async () => {
    if (!shippingData.postal_code || !shippingData.province) return;
    
    setLoading(true);
    try {
      const response = await api.post("/shipments/quote", {
        postal_code: shippingData.postal_code,
        province: shippingData.province,
        items_count: carrito.length,
      });
      setShippingQuotes(response.data.options || []);
      if (response.data.options?.length > 0) {
        setSelectedShipping(response.data.options[0]);
      }
    } catch (error) {
      console.error("Error al obtener cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shippingData.postal_code.length >= 4 && shippingData.province) {
      const timer = setTimeout(fetchShippingQuotes, 500);
      return () => clearTimeout(timer);
    }
  }, [shippingData.postal_code, shippingData.province]);

  // Validar paso actual
  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      const { full_name, street, city, province, postal_code, phone } = shippingData;
      if (!full_name || !street || !city || !province || !postal_code || !phone) {
        Swal.fire("Error", "Completá todos los campos de envío", "error");
        return false;
      }
      if (!selectedShipping) {
        Swal.fire("Error", "Seleccioná un método de envío", "error");
        return false;
      }
    }
    return true;
  };

  // Siguiente paso
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // Confirmar orden
  const confirmOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: carrito.map((item) => ({
          product_id: item.id,
          quantity: item.cantidad,
          size: item.talle,
          price_minor: item.price_minor,
        })),
        shipping_address: shippingData,
        notes: "",
      };

      const response = await api.post("/orders", orderData);
      
      // Limpiar carrito
      setCarrito([]);
      
      Swal.fire({
        title: "¡Orden confirmada!",
        html: `
          <p>Tu número de orden es:</p>
          <h2 style="color: #71b100">${response.data.order.order_number}</h2>
          <p>Recibirás un email con los detalles.</p>
        `,
        icon: "success",
        confirmButtonColor: "#71b100",
      }).then(() => {
        navigate("/");
      });
    } catch (error) {
      console.error("Error al crear orden:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "No se pudo crear la orden",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Tu carrito está vacío</h2>
        <button onClick={() => navigate("/")} className="btn-primary">
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Progress bar */}
      <div className="checkout-progress">
        <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
          <span className="step-number">1</span>
          <span className="step-label">Envío</span>
        </div>
        <div className={`progress-line ${step >= 2 ? "active" : ""}`}></div>
        <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Pago</span>
        </div>
        <div className={`progress-line ${step >= 3 ? "active" : ""}`}></div>
        <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
          <span className="step-number">3</span>
          <span className="step-label">Confirmar</span>
        </div>
      </div>

      <div className="checkout-content">
        {/* Formulario principal */}
        <div className="checkout-form">
          {/* PASO 1: Envío */}
          {step === 1 && (
            <div className="checkout-step">
              <h2>Datos de envío</h2>
              
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={shippingData.full_name}
                  onChange={(e) =>
                    setShippingData({ ...shippingData, full_name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={shippingData.street}
                  onChange={(e) =>
                    setShippingData({ ...shippingData, street: e.target.value })
                  }
                  placeholder="Av. Corrientes 1234, Piso 5"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={shippingData.city}
                    onChange={(e) =>
                      setShippingData({ ...shippingData, city: e.target.value })
                    }
                    placeholder="Buenos Aires"
                  />
                </div>

                <div className="form-group">
                  <label>Provincia</label>
                  <select
                    value={shippingData.province}
                    onChange={(e) =>
                      setShippingData({ ...shippingData, province: e.target.value })
                    }
                  >
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Código Postal</label>
                  <input
                    type="text"
                    value={shippingData.postal_code}
                    onChange={(e) =>
                      setShippingData({ ...shippingData, postal_code: e.target.value })
                    }
                    placeholder="1414"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={shippingData.phone}
                    onChange={(e) =>
                      setShippingData({ ...shippingData, phone: e.target.value })
                    }
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>

              {/* Opciones de envío */}
              {shippingQuotes.length > 0 ? (
                <div className="shipping-options">
                  <h3>Método de envío</h3>
                  {shippingQuotes.map((option, index) => (
                    <label
                      key={index}
                      className={`shipping-option ${
                        selectedShipping === option ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping === option}
                        onChange={() => setSelectedShipping(option)}
                      />
                      <div className="option-info">
                        <span className="option-name">{option.name}</span>
                        <span className="option-delivery">
                          {option.estimated_days} días hábiles
                        </span>
                      </div>
                      <span className="option-price">
                        ${(option.price_minor / 100).toLocaleString("es-AR")}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="shipping-notice">
                  <h3>Método de envío</h3>
                  {shippingData.postal_code.length < 4 ? (
                    <p className="notice-text">📍 Ingresá tu código postal para ver opciones de envío</p>
                  ) : loading ? (
                    <p className="loading-text">🔄 Calculando envío...</p>
                  ) : (
                    <p className="notice-text">⚠️ No hay opciones de envío disponibles para tu zona</p>
                  )}
                </div>
              )}

              {loading && shippingQuotes.length > 0 && <p className="loading-text">Actualizando...</p>}
            </div>
          )}

          {/* PASO 2: Pago */}
          {step === 2 && (
            <div className="checkout-step">
              <h2>Método de pago</h2>
              
              <div className="payment-options">
                <label
                  className={`payment-option ${
                    paymentMethod === "card" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-icon">💳</div>
                  <div className="payment-info">
                    <span className="payment-name">Tarjeta de crédito/débito</span>
                    <span className="payment-desc">Visa, Mastercard, American Express</span>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod === "transfer" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-icon">🏦</div>
                  <div className="payment-info">
                    <span className="payment-name">Transferencia bancaria</span>
                    <span className="payment-desc">10% de descuento</span>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod === "cash" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-icon">💵</div>
                  <div className="payment-info">
                    <span className="payment-name">Efectivo</span>
                    <span className="payment-desc">Rapipago, Pago Fácil</span>
                  </div>
                </label>
              </div>

              {paymentMethod === "card" && (
                <div className="card-form">
                  <p className="card-notice">
                    Serás redirigido al procesador de pago seguro al confirmar.
                  </p>
                </div>
              )}

              {paymentMethod === "transfer" && (
                <div className="transfer-info">
                  <p>Recibirás los datos bancarios por email al confirmar.</p>
                  <p className="discount-badge">🎉 10% OFF aplicado al total</p>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Confirmación */}
          {step === 3 && (
            <div className="checkout-step">
              <h2>Confirmar pedido</h2>
              
              <div className="confirmation-section">
                <h3>📦 Envío</h3>
                <p>{shippingData.full_name}</p>
                <p>{shippingData.street}</p>
                <p>
                  {shippingData.city}, {shippingData.province} ({shippingData.postal_code})
                </p>
                <p>{shippingData.phone}</p>
                <p className="shipping-method">
                  {selectedShipping?.name} - {selectedShipping?.estimated_days} días
                </p>
              </div>

              <div className="confirmation-section">
                <h3>💳 Pago</h3>
                <p>
                  {paymentMethod === "card" && "Tarjeta de crédito/débito"}
                  {paymentMethod === "transfer" && "Transferencia bancaria (10% OFF)"}
                  {paymentMethod === "cash" && "Efectivo (Rapipago/Pago Fácil)"}
                </p>
              </div>

              <div className="confirmation-section">
                <h3>🛒 Productos ({carrito.length})</h3>
                {carrito.map((item, index) => (
                  <div key={index} className="confirm-item">
                    <span>
                      {item.brand} {item.model} - Talle {item.talle} x{item.cantidad}
                    </span>
                    <span>
                      ${((item.price_minor / 100) * item.cantidad).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="checkout-summary">
          <h3>Resumen del pedido</h3>
          
          <div className="summary-items">
            {carrito.map((item, index) => (
              <div key={index} className="summary-item">
                <span className="item-name">
                  {item.brand} {item.model}
                  <small> (Talle {item.talle}) x{item.cantidad}</small>
                </span>
                <span className="item-price">
                  ${((item.price_minor / 100) * item.cantidad).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString("es-AR")}</span>
            </div>
            <div className="summary-row">
              <span>IVA (21%)</span>
              <span>${tax.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>
                {shippingCost > 0
                  ? `$${shippingCost.toLocaleString("es-AR")}`
                  : "Calculando..."}
              </span>
            </div>
            {paymentMethod === "transfer" && (
              <div className="summary-row discount">
                <span>Descuento (10%)</span>
                <span>-${(total * 0.1).toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>
                $
                {(paymentMethod === "transfer" ? total * 0.9 : total).toLocaleString(
                  "es-AR",
                  { maximumFractionDigits: 2 }
                )}
              </span>
            </div>
          </div>

          <div className="checkout-actions">
            {step > 1 && (
              <button
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
              >
                Volver
              </button>
            )}
            {step < 3 ? (
              <button className="btn-primary" onClick={nextStep}>
                Continuar
              </button>
            ) : (
              <button
                className="btn-primary btn-confirm"
                onClick={confirmOrder}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Confirmar pedido"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
