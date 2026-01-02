import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const PedidosAdmin = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Usar el nuevo endpoint de admin
      const response = await api.get("/admin/orders"); 
      const data = response.data.data || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      // Mostrar error real, no datos de demo
      Swal.fire(
        "Error", 
        "No se pudieron cargar los pedidos. Verifique la conexión con el servidor.", 
        "error"
      );
      setOrders([]); // Limpiar los pedidos en caso de error
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: "⏳ Pendiente", class: "status-pending" },
      paid: { text: "💳 Pagado", class: "status-paid" },
      processing: { text: "📦 Procesando", class: "status-processing" },
      shipped: { text: "🚚 Enviado", class: "status-shipped" },
      delivered: { text: "✅ Entregado", class: "status-delivered" },
      cancelled: { text: "❌ Cancelado", class: "status-cancelled" }
    };
    return labels[status] || { text: status, class: "" };
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Usar el nuevo endpoint de admin para actualizar
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      Swal.fire("Éxito", "Estado del pedido actualizado", "success");
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      // Mostrar error real
      Swal.fire(
        "Error", 
        "No se pudo actualizar el estado del pedido.", 
        "error"
      );
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando pedidos...</p>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => setSelectedOrder(null)}>
          ← Volver a la lista
        </button>
        <h2>Pedido #{selectedOrder.id}</h2>
        
        <div className="order-detail-card">
          <div className="order-detail-header">
            <div className="customer-info">
              <h3>👤 Cliente</h3>
              <p><strong>Nombre:</strong> {selectedOrder.user_name}</p>
              <p><strong>Email:</strong> {selectedOrder.user_email}</p>
            </div>
            <div className="order-status-info">
              <h3>📋 Estado</h3>
              <span className={`order-status ${getStatusLabel(selectedOrder.status).class}`}>
                {getStatusLabel(selectedOrder.status).text}
              </span>
              <select 
                value={selectedOrder.status}
                onChange={(e) => {
                  handleStatusChange(selectedOrder.id, e.target.value);
                  // Actualización optimista para la UI
                  setSelectedOrder({ ...selectedOrder, status: e.target.value });
                }}
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

          <div className="order-items">
            <h3>📦 Productos</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talle</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td> {/* Cambiado de item.product_name a item.name */}
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.price_minor / 100).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="order-total">
            <h3>Total: ${(selectedOrder.total_minor / 100).toLocaleString("es-AR")}</h3>
          </div>

          <div className="order-date">
            <p>📅 Fecha del pedido: {formatDate(selectedOrder.created_at)}</p>
          </div>
        </div>
      </div>
    );
  }

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
                <th>ID</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
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
                  <td className="price-cell">
                    ${(order.total_minor / 100).toLocaleString("es-AR")}
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
