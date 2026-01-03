import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from 'ethers';
import { CarritoContext } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import api from "../api/client";
import MarketplaceABI from '../abi/Marketplace.json';
import Swal from "sweetalert2";
import "./Checkout.css";

const MARKETPLACE_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const Checkout = () => {
  const { carrito, setCarrito } = useContext(CarritoContext);
  const { user, isAuthenticated } = useAuth();
  const { signer, isConnected, connectWallet, address } = useWeb3();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: envío, 2: pago, 3: confirmación
  const [loading, setLoading] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  
  const [shippingData, setShippingData] = useState({
    full_name: "",
    street: "",
    apartment: "",
    city: "",
    province: "Buenos Aires",
    postal_code: "",
    country: "Argentina",
    phone: "",
    instructions: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card"); // card, transfer, cash, blockchain
  const [processingBlockchain, setProcessingBlockchain] = useState(false);

  const provinces = [
    "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
    "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero",
    "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut",
    "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Tierra del Fuego",
  ];

  // Cargar direcciones guardadas del usuario
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedAddresses();
    }
  }, [isAuthenticated]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await api.get("/checkout/addresses");
      setSavedAddresses(response.data);
      // Si hay dirección default, seleccionarla
      const defaultAddr = response.data.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        loadAddressToForm(defaultAddr);
      } else if (response.data.length > 0) {
        setSelectedAddressId(response.data[0].id);
        loadAddressToForm(response.data[0]);
      } else {
        setShowNewAddressForm(true);
      }
    } catch (error) {
      console.error("Error al cargar direcciones:", error);
      setShowNewAddressForm(true);
    }
  };

  const loadAddressToForm = (addr) => {
    setShippingData({
      full_name: addr.full_name || addr.recipient_name || "",
      street: addr.street || "",
      apartment: addr.apartment || "",
      city: addr.city || "",
      province: addr.province || "Buenos Aires",
      postal_code: addr.postal_code || "",
      country: addr.country || "Argentina",
      phone: addr.phone || "",
      instructions: addr.instructions || "",
    });
  };

  // Normalizar precio
  const getPrecio = (item) => {
    if (item.price_minor !== undefined) return item.price_minor / 100;
    return item.precio || 0;
  };

  // Calcular totales
  const precioFinal = carrito.reduce(
    (acc, item) => acc + getPrecio(item) * item.cantidad,
    0
  );
  
  const subtotal = precioFinal / 1.21;
  const tax = precioFinal - subtotal;
  const shippingCost = selectedShipping ? selectedShipping.price_minor / 100 : 0;
  
  // Descuento según método de pago
  const getDiscount = () => {
    if (paymentMethod === "transfer") return 0.10;
    if (paymentMethod === "blockchain") return 0.05; // 5% descuento por blockchain
    return 0;
  };
  
  const discount = precioFinal * getDiscount();
  const total = precioFinal - discount + shippingCost;

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
      // Fallback: envío fijo
      const fallbackShipping = [
        { name: "Envío estándar", estimated_days: 5, price_minor: 150000 },
        { name: "Envío express", estimated_days: 2, price_minor: 280000 },
      ];
      setShippingQuotes(fallbackShipping);
      setSelectedShipping(fallbackShipping[0]);
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
    if (currentStep === 2) {
      if (paymentMethod === "blockchain" && !isConnected) {
        Swal.fire("Wallet no conectada", "Conectá tu wallet para pagar con blockchain", "warning");
        return false;
      }
    }
    return true;
  };

  // Siguiente paso
  const nextStep = async () => {
    if (validateStep(step)) {
      // Guardar dirección si es nueva y el usuario lo solicita
      if (step === 1 && showNewAddressForm && saveNewAddress && isAuthenticated) {
        try {
          const response = await api.post("/checkout/addresses", {
            ...shippingData,
            label: "Casa",
            is_default: savedAddresses.length === 0,
          });
          setSavedAddresses([...savedAddresses, response.data]);
        } catch (error) {
          console.log("No se pudo guardar la dirección:", error);
        }
      }
      setStep(step + 1);
    }
  };

  // Pago con blockchain
  const processBlockchainPayment = async (orderId, totalMinor) => {
    if (!isConnected || !signer) {
      Swal.fire('Wallet no conectada', 'Conectá tu wallet para continuar', 'warning');
      connectWallet();
      return null;
    }

    setProcessingBlockchain(true);
    try {
      const marketplaceContract = new ethers.Contract(
        MARKETPLACE_CONTRACT_ADDRESS, 
        MarketplaceABI, 
        signer
      );
      
      // Para simplificar, usamos el primer item del carrito
      // En producción se debería manejar múltiples items
      const firstItem = carrito[0];
      const marketplaceItemId = firstItem.listingId || firstItem.id;
      
      const tx = await marketplaceContract.purchaseItem(marketplaceItemId, {
        value: totalMinor.toString()
      });

      Swal.fire({
        title: 'Procesando transacción...',
        html: 'Esperando confirmación en blockchain',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error('La transacción falló');
      }

      return tx.hash;
    } catch (error) {
      console.error('Error en pago blockchain:', error);
      throw error;
    } finally {
      setProcessingBlockchain(false);
    }
  };

  // Confirmar orden
  const confirmOrder = async () => {
    if (!isAuthenticated) {
      Swal.fire({
        title: "Iniciá sesión",
        text: "Necesitás estar logueado para completar la compra",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Iniciar sesión",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: "/checkout" } });
        }
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar datos de la orden
      const orderData = {
        items: carrito.map((item) => ({
          product_id: item.productId || item.id,
          listing_id: item.listingId || null,
          quantity: item.cantidad,
          size: item.talle,
          price_minor: item.price_minor || Math.round(item.precio * 100),
        })),
        shipping_address: shippingData,
        shipping_address_id: selectedAddressId,
        shipping_method: selectedShipping?.name,
        shipping_cost_minor: selectedShipping?.price_minor || 0,
        payment_method: paymentMethod,
        wallet_address: paymentMethod === "blockchain" ? address : null,
        notes: shippingData.instructions || "",
      };

      // Crear la orden
      const response = await api.post("/orders", orderData);
      const order = response.data.order;

      // Si es pago blockchain, procesar el pago
      if (paymentMethod === "blockchain") {
        try {
          const totalMinor = Math.round(total * 100);
          const txHash = await processBlockchainPayment(order.id, totalMinor);
          
          if (txHash) {
            // Confirmar pago en backend
            await api.post("/checkout/blockchain-payment", {
              order_id: order.id,
              transaction_hash: txHash,
            });
          }
        } catch (blockchainError) {
          Swal.fire(
            "Error en el pago",
            "La transacción blockchain falló. Tu orden fue creada pero está pendiente de pago.",
            "warning"
          );
          navigate(`/mis-ordenes/${order.id}`);
          return;
        }
      }
      
      // Limpiar carrito
      setCarrito([]);
      
      Swal.fire({
        title: "¡Orden confirmada!",
        html: `
          <p>Tu número de orden es:</p>
          <h2 style="color: #71b100">${order.order_number}</h2>
          ${paymentMethod === "blockchain" 
            ? '<p class="blockchain-confirmed">✅ Pago confirmado en blockchain</p>' 
            : '<p>Recibirás un email con los detalles del pago.</p>'
          }
        `,
        icon: "success",
        confirmButtonColor: "#71b100",
      }).then(() => {
        navigate("/mis-ordenes");
      });
    } catch (error) {
      console.error("Error al crear orden:", error);
      
      // Obtener mensaje de error del backend
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error 
        || "No se pudo crear la orden";
      
      // Si el error es de validación de dirección, volver al paso 1
      const isAddressError = errorMsg.toLowerCase().includes('address') 
        || errorMsg.toLowerCase().includes('shipping')
        || errorMsg.toLowerCase().includes('name')
        || errorMsg.toLowerCase().includes('phone')
        || errorMsg.toLowerCase().includes('street');
      
      Swal.fire({
        title: "Error",
        text: errorMsg,
        icon: "error",
        showCancelButton: isAddressError,
        confirmButtonText: isAddressError ? "Editar dirección" : "OK",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#71b100",
      }).then((result) => {
        if (result.isConfirmed && isAddressError) {
          setStep(1); // Volver al paso de envío
        }
      });
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
              
              {/* Direcciones guardadas */}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="saved-addresses">
                  <h3>Tus direcciones</h3>
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-option ${selectedAddressId === addr.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => {
                          setSelectedAddressId(addr.id);
                          loadAddressToForm(addr);
                        }}
                      />
                      <div className="address-info">
                        <span className="address-label">{addr.label || "Dirección"}</span>
                        <span className="address-name">{addr.full_name || addr.recipient_name}</span>
                        <span className="address-street">
                          {addr.street}{addr.apartment ? `, ${addr.apartment}` : ""}
                        </span>
                        <span className="address-city">
                          {addr.city}, {addr.province} ({addr.postal_code})
                        </span>
                      </div>
                      {addr.is_default && <span className="default-badge">Principal</span>}
                    </label>
                  ))}
                  <button 
                    type="button" 
                    className="btn-add-address"
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setSelectedAddressId(null);
                      setShippingData({
                        full_name: user?.name || "",
                        street: "",
                        apartment: "",
                        city: "",
                        province: "Buenos Aires",
                        postal_code: "",
                        country: "Argentina",
                        phone: "",
                        instructions: "",
                      });
                    }}
                  >
                    + Agregar nueva dirección
                  </button>
                </div>
              )}

              {/* Formulario de nueva dirección */}
              {(showNewAddressForm || savedAddresses.length === 0) && (
                <div className="new-address-form">
                  {savedAddresses.length > 0 && (
                    <button 
                      type="button" 
                      className="btn-back-addresses"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        if (savedAddresses.length > 0) {
                          const defaultAddr = savedAddresses.find(a => a.is_default) || savedAddresses[0];
                          setSelectedAddressId(defaultAddr.id);
                          loadAddressToForm(defaultAddr);
                        }
                      }}
                    >
                      ← Usar dirección guardada
                    </button>
                  )}
                  
                  <div className="form-group">
                    <label>Nombre completo (quien recibe)</label>
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
                      placeholder="Av. Corrientes 1234"
                    />
                  </div>

                  <div className="form-group">
                    <label>Piso/Depto (opcional)</label>
                    <input
                      type="text"
                      value={shippingData.apartment}
                      onChange={(e) =>
                        setShippingData({ ...shippingData, apartment: e.target.value })
                      }
                      placeholder="Piso 5, Depto B"
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

                  <div className="form-group">
                    <label>Instrucciones de entrega (opcional)</label>
                    <textarea
                      value={shippingData.instructions}
                      onChange={(e) =>
                        setShippingData({ ...shippingData, instructions: e.target.value })
                      }
                      placeholder="Timbre 3B, dejar con el portero, etc."
                      rows={2}
                    />
                  </div>

                  {isAuthenticated && (
                    <label className="save-address-checkbox">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                      />
                      Guardar esta dirección para futuras compras
                    </label>
                  )}
                </div>
              )}

              {/* Opciones de envío */}
              <div className="shipping-section">
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
              </div>
            </div>
          )}

          {/* PASO 2: Pago */}
          {step === 2 && (
            <div className="checkout-step">
              <h2>Método de pago</h2>
              
              {/* Banner destacado de Blockchain */}
              <div className="blockchain-banner">
                <div className="banner-content">
                  <span className="banner-badge">🚀 NUEVO</span>
                  <h3>¡Pagá con Blockchain!</h3>
                  <p>5% de descuento • Transacción segura • Sin intermediarios</p>
                </div>
                <label
                  className={`payment-option blockchain-option ${
                    paymentMethod === "blockchain" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="blockchain"
                    checked={paymentMethod === "blockchain"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-icon">⛓️</div>
                  <div className="payment-info">
                    <span className="payment-name">Pago con Wallet</span>
                    <span className="payment-desc">
                      {isConnected 
                        ? `Conectado: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                        : "Conectá tu wallet para continuar"
                      }
                    </span>
                  </div>
                  <span className="discount-tag">5% OFF</span>
                </label>
                {paymentMethod === "blockchain" && !isConnected && (
                  <button className="btn-connect-wallet" onClick={connectWallet}>
                    🔗 Conectar Wallet
                  </button>
                )}
              </div>

              <div className="payment-divider">
                <span>o pagá de forma tradicional</span>
              </div>
              
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
                    <span className="payment-desc">CBU / Alias</span>
                  </div>
                  <span className="discount-tag">10% OFF</span>
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
                <div className="payment-notice">
                  <p>💳 Serás redirigido al procesador de pago seguro al confirmar.</p>
                </div>
              )}

              {paymentMethod === "transfer" && (
                <div className="payment-notice transfer-notice">
                  <p>🏦 Recibirás los datos bancarios por email al confirmar.</p>
                  <p className="discount-applied">🎉 ¡10% de descuento aplicado!</p>
                </div>
              )}

              {paymentMethod === "blockchain" && isConnected && (
                <div className="payment-notice blockchain-notice">
                  <p>⛓️ Tu wallet está lista para realizar el pago.</p>
                  <p className="discount-applied">🎉 ¡5% de descuento aplicado!</p>
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
                <p><strong>{shippingData.full_name}</strong></p>
                <p>{shippingData.street}{shippingData.apartment ? `, ${shippingData.apartment}` : ""}</p>
                <p>
                  {shippingData.city}, {shippingData.province} ({shippingData.postal_code})
                </p>
                <p>📞 {shippingData.phone}</p>
                {shippingData.instructions && (
                  <p className="instructions">📝 {shippingData.instructions}</p>
                )}
                <p className="shipping-method">
                  🚚 {selectedShipping?.name} - {selectedShipping?.estimated_days} días hábiles
                </p>
              </div>

              <div className="confirmation-section">
                <h3>💳 Pago</h3>
                <p className={`payment-method-confirm ${paymentMethod}`}>
                  {paymentMethod === "card" && "💳 Tarjeta de crédito/débito"}
                  {paymentMethod === "transfer" && "🏦 Transferencia bancaria (10% OFF)"}
                  {paymentMethod === "cash" && "💵 Efectivo (Rapipago/Pago Fácil)"}
                  {paymentMethod === "blockchain" && (
                    <>
                      ⛓️ Pago con Wallet (5% OFF)
                      <span className="wallet-address">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="confirmation-section">
                <h3>🛒 Productos ({carrito.length})</h3>
                {carrito.map((item, index) => (
                  <div key={index} className="confirm-item">
                    <span>
                      {item.nombre || `${item.brand} ${item.model}`}
                      {item.talle && ` - Talle ${item.talle}`} x{item.cantidad}
                    </span>
                    <span>
                      ${(getPrecio(item) * item.cantidad).toLocaleString("es-AR")}
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
                  {item.nombre || `${item.brand} ${item.model}`}
                  <small> {item.talle && `(Talle ${item.talle})`} x{item.cantidad}</small>
                </span>
                <span className="item-price">
                  ${(getPrecio(item) * item.cantidad).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="summary-row">
              <span>IVA (21%)</span>
              <span>${tax.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>
                {shippingCost > 0
                  ? `$${shippingCost.toLocaleString("es-AR")}`
                  : step === 1 ? "Calculando..." : "$0"}
              </span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>
                  Descuento ({paymentMethod === "transfer" ? "10%" : "5%"})
                </span>
                <span>-${discount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>
                ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="checkout-actions">
            {step > 1 && (
              <button
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
              >
                ← Volver
              </button>
            )}
            {step < 3 ? (
              <button className="btn-primary" onClick={nextStep}>
                Continuar →
              </button>
            ) : (
              <button
                className={`btn-primary btn-confirm ${paymentMethod === "blockchain" ? "btn-blockchain" : ""}`}
                onClick={confirmOrder}
                disabled={loading || processingBlockchain}
              >
                {loading || processingBlockchain 
                  ? "Procesando..." 
                  : paymentMethod === "blockchain"
                    ? "⛓️ Confirmar y Pagar"
                    : "Confirmar pedido"
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
