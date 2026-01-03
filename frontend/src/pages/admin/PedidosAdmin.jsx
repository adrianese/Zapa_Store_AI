import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const PedidosAdmin = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({
    tracking_number: "",
    tracking_carrier: "",
    tracking_url: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/orders"); 
      const data = response.data.data || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      Swal.fire(
        "Error", 
        "No se pudieron cargar los pedidos. Verifique la conexión con el servidor.", 
        "error"
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: "⏳ Pendiente", class: "status-pending" },
      awaiting_payment: { text: "💳 Esperando Pago", class: "status-pending" },
      paid: { text: "✅ Pagado", class: "status-paid" },
      processing: { text: "📦 Procesando", class: "status-processing" },
      shipped: { text: "🚚 Enviado", class: "status-shipped" },
      delivered: { text: "✅ Entregado", class: "status-delivered" },
      cancelled: { text: "❌ Cancelado", class: "status-cancelled" }
    };
    return labels[status] || { text: status, class: "" };
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      card: "💳 Tarjeta",
      transfer: "🏦 Transferencia",
      cash: "💵 Efectivo",
      blockchain: "⛓️ Blockchain",
    };
    return methods[method] || method || "—";
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      Swal.fire("Éxito", "Estado del pedido actualizado", "success");
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      Swal.fire("Error", "No se pudo actualizar el estado del pedido.", "error");
    }
  };

  const handleAddTracking = async () => {
    if (!trackingData.tracking_number) {
      Swal.fire("Error", "El número de tracking es requerido", "warning");
      return;
    }

    try {
      const response = await api.put(`/admin/orders/${selectedOrder.id}/tracking`, trackingData);
      
      // Actualizar orden en el estado
      const updatedOrder = response.data.order?.data || response.data.order;
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
      setSelectedOrder(prev => ({ ...prev, ...updatedOrder, status: 'shipped' }));
      setShowTrackingModal(false);
      setTrackingData({ tracking_number: "", tracking_carrier: "", tracking_url: "" });
      
      Swal.fire("Éxito", "Tracking agregado. El pedido fue marcado como enviado.", "success");
    } catch (err) {
      console.error("Error al agregar tracking:", err);
      Swal.fire("Error", "No se pudo agregar el tracking.", "error");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    const result = await Swal.fire({
      title: "¿Marcar como entregado?",
      text: "Esta acción confirmará que el pedido fue recibido por el cliente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#71b100",
      cancelButtonColor: "#999",
      confirmButtonText: "Sí, marcar entregado",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/orders/${orderId}/delivered`);
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'delivered' } : o
        ));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: 'delivered' }));
        }
        Swal.fire("Éxito", "Pedido marcado como entregado", "success");
      } catch (err) {
        console.error("Error:", err);
        Swal.fire("Error", "No se pudo actualizar el pedido.", "error");
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (address) => {
    if (!address) return null;
    return (
      <div className="shipping-address-display">
        <p><strong>{address.full_name || address.recipient_name}</strong></p>
        <p>{address.street}{address.apartment ? `, ${address.apartment}` : ""}</p>
        <p>{address.city}, {address.province} {address.postal_code}</p>
        <p>{address.country}</p>
        {address.phone && <p>📞 {address.phone}</p>}
        {address.instructions && <p className="instructions">📝 {address.instructions}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando pedidos...</p>
      </div>
    );
  }

  // Vista de detalle del pedido
  if (selectedOrder) {
    const shippingAddress = selectedOrder.shipping_address_snapshot || selectedOrder.shipping_address;
    
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => setSelectedOrder(null)}>
          ← Volver a la lista
        </button>
        <h2>Pedido #{selectedOrder.order_number || selectedOrder.id}</h2>
        
        <div className="order-detail-grid">
          {/* Info del cliente */}
          <div className="order-detail-card">
            <h3>👤 Cliente</h3>
            <div className="detail-content">
              <p><strong>Nombre:</strong> {selectedOrder.user_name}</p>
              <p><strong>Email:</strong> {selectedOrder.user_email}</p>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="order-detail-card">
            <h3>📋 Estado del Pedido</h3>
            <div className="detail-content">
              <span className={`order-status ${getStatusLabel(selectedOrder.status).class}`}>
                {getStatusLabel(selectedOrder.status).text}
              </span>
              <div className="status-actions">
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="order-detail-card">
            <h3>📍 Dirección de Envío</h3>
            <div className="detail-content">
              {shippingAddress ? formatAddress(shippingAddress) : (
                <p className="no-data">No hay dirección de envío registrada</p>
              )}
            </div>
          </div>

          {/* Tracking */}
          <div className="order-detail-card">
            <h3>🚚 Seguimiento de Envío</h3>
            <div className="detail-content">
              {selectedOrder.tracking_number ? (
                <div className="tracking-info">
                  <p><strong>Número:</strong> {selectedOrder.tracking_number}</p>
                  {selectedOrder.tracking_carrier && (
                    <p><strong>Carrier:</strong> {selectedOrder.tracking_carrier}</p>
                  )}
                  {selectedOrder.shipped_at && (
                    <p><strong>Enviado:</strong> {formatDate(selectedOrder.shipped_at)}</p>
                  )}
                  {selectedOrder.delivered_at && (
                    <p><strong>Entregado:</strong> {formatDate(selectedOrder.delivered_at)}</p>
                  )}
                  {selectedOrder.tracking_url && (
                    <a 
                      href={selectedOrder.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tracking-link"
                    >
                      🔗 Ver seguimiento
                    </a>
                  )}
                </div>
              ) : (
                <div className="no-tracking">
                  <p className="no-data">Sin tracking asignado</p>
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <button 
                      className="boton-agregar-tracking"
                      onClick={() => setShowTrackingModal(true)}
                    >
                      ➕ Agregar Tracking
                    </button>
                  )}
                </div>
              )}
              
              {selectedOrder.status === 'shipped' && (
                <button 
                  className="boton-verde boton-entregar"
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                >
                  ✅ Marcar como Entregado
                </button>
              )}
            </div>
          </div>

          {/* Método de pago */}
          <div className="order-detail-card">
            <h3>💳 Pago</h3>
            <div className="detail-content">
              <p><strong>Método:</strong> {getPaymentMethodLabel(selectedOrder.payment_method)}</p>
              {selectedOrder.transaction_hash && (
                <p className="tx-hash">
                  <strong>TX:</strong> 
                  <code>{selectedOrder.transaction_hash.slice(0, 10)}...{selectedOrder.transaction_hash.slice(-8)}</code>
                </p>
              )}
              {selectedOrder.invoice_number && (
                <p><strong>Factura:</strong> {selectedOrder.invoice_number}</p>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div className="order-detail-card">
            <h3>📅 Fechas</h3>
            <div className="detail-content">
              <p><strong>Creado:</strong> {formatDate(selectedOrder.created_at)}</p>
              <p><strong>Actualizado:</strong> {formatDate(selectedOrder.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="order-items-section">
          <h3>📦 Productos</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talle</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">{item.name}</span>
                      {item.brand && <small className="product-brand">{item.brand}</small>}
                    </div>
                  </td>
                  <td>{item.size || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.price_minor / 100).toLocaleString("es-AR")}</td>
                  <td>${((item.price_minor * item.quantity) / 100).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${(selectedOrder.subtotal_minor / 100).toLocaleString("es-AR")}</span>
            </div>
            {selectedOrder.tax_minor > 0 && (
              <div className="total-row">
                <span>Impuestos:</span>
                <span>${(selectedOrder.tax_minor / 100).toLocaleString("es-AR")}</span>
              </div>
            )}
            {selectedOrder.shipping_minor > 0 && (
              <div className="total-row">
                <span>Envío:</span>
                <span>${(selectedOrder.shipping_minor / 100).toLocaleString("es-AR")}</span>
              </div>
            )}
            <div className="total-row total-final">
              <span>Total:</span>
              <span>${(selectedOrder.total_minor / 100).toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>

        {/* Modal de Tracking */}
        {showTrackingModal && (
          <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
            <div className="modal-content tracking-modal" onClick={e => e.stopPropagation()}>
              <h3>➕ Agregar Tracking</h3>
              <div className="form-group">
                <label>Número de Tracking *</label>
                <input
                  type="text"
                  value={trackingData.tracking_number}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="Ej: 1234567890"
                />
              </div>
              <div className="form-group">
                <label>Carrier / Empresa</label>
                <select
                  value={trackingData.tracking_carrier}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, tracking_carrier: e.target.value }))}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Andreani">Andreani</option>
                  <option value="OCA">OCA</option>
                  <option value="Correo Argentino">Correo Argentino</option>
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL de Seguimiento (opcional)</label>
                <input
                  type="url"
                  value={trackingData.tracking_url}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, tracking_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="modal-actions">
                <button className="boton-verde" onClick={handleAddTracking}>
                  💾 Guardar Tracking
                </button>
                <button className="boton-cancelar" onClick={() => setShowTrackingModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista principal - Lista de pedidos
  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>📋 Gestión de Pedidos</h2>
      <p className="admin-subtitle">Total de pedidos: {orders.length}</p>

      <div className="orders-filter">
        <label>Filtrar por estado:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagados</option>
          <option value="processing">Procesando</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="empty-text">⚠️ No hay pedidos que mostrar.</p>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Tracking</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.order_number || order.id}</strong>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <strong>{order.user_name}</strong>
                      <small>{order.user_email}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`order-status ${getStatusLabel(order.status).class}`}>
                      {getStatusLabel(order.status).text}
                    </span>
                  </td>
                  <td>{getPaymentMethodLabel(order.payment_method)}</td>
                  <td className="price-cell">
                    ${(order.total_minor / 100).toLocaleString("es-AR")}
                  </td>
                  <td>
                    {order.tracking_number ? (
                      <span className="has-tracking">📦 {order.tracking_number.slice(0, 10)}...</span>
                    ) : (
                      <span className="no-tracking-badge">—</span>
                    )}
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <button 
                      className="btn-view"
                      onClick={() => setSelectedOrder(order)}
                      title="Ver detalles"
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PedidosAdmin;
