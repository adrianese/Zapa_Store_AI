import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import "./AdminCommon.css";

const EstadisticasAdmin = ({ onBack }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalAuctions: 0,
    recentOrders: [],
    topProducts: [],
    salesByMonth: [],
    metrics: {
      avgTicket: 0,
      newUsersThisMonth: 0,
      newOrdersThisWeek: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el nuevo endpoint de métricas de admin
      const response = await api.get("/admin/metrics");
      const data = response.data.data;

      setStats({
        totalSales: data.totals.sales || 0,
        totalOrders: data.totals.orders || 0,
        totalProducts: data.totals.products || 0,
        totalUsers: data.totals.users || 0,
        totalAuctions: data.totals.auctions || 0,
        recentOrders: data.recentOrders || [],
        topProducts: data.topProducts || [],
        salesByMonth: data.salesByMonth || [],
        metrics: data.metrics || {},
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
      setError("No se pudieron cargar las estadísticas. Verifica la conexión con el servidor.");
      // Datos vacíos en caso de error
      setStats({
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        totalAuctions: 0,
        recentOrders: [],
        topProducts: [],
        salesByMonth: [],
        metrics: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `$${(value / 100).toLocaleString("es-AR")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Hace menos de 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("es-AR");
  };

  const maxSales = stats.salesByMonth.length > 0 
    ? Math.max(...stats.salesByMonth.map(m => m.sales), 1) 
    : 1;

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>📊 Estadísticas del Negocio</h2>
      <p className="admin-subtitle">Resumen de métricas y rendimiento</p>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={fetchStats} className="retry-btn">Reintentar</button>
        </div>
      )}

      {/* KPIs principales */}
      <div className="stats-kpis">
        <div className="kpi-card kpi-sales">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Ventas Totales</h3>
            <p className="kpi-value">{formatCurrency(stats.totalSales)}</p>
          </div>
        </div>

        <div className="kpi-card kpi-orders">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <h3>Pedidos</h3>
            <p className="kpi-value">{stats.totalOrders}</p>
            {stats.metrics.newOrdersThisWeek > 0 && (
              <span className="kpi-trend positive">↑ {stats.metrics.newOrdersThisWeek} esta semana</span>
            )}
          </div>
        </div>

        <div className="kpi-card kpi-products">
          <div className="kpi-icon">👟</div>
          <div className="kpi-content">
            <h3>Productos</h3>
            <p className="kpi-value">{stats.totalProducts}</p>
            <span className="kpi-trend neutral">En catálogo</span>
          </div>
        </div>

        <div className="kpi-card kpi-users">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>Usuarios</h3>
            <p className="kpi-value">{stats.totalUsers}</p>
            {stats.metrics.newUsersThisMonth > 0 && (
              <span className="kpi-trend positive">↑ {stats.metrics.newUsersThisMonth} este mes</span>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de ventas por mes */}
      {stats.salesByMonth.length > 0 && (
        <div className="stats-chart-section">
          <h3>📈 Ventas por Mes (últimos 6 meses)</h3>
          <div className="simple-chart">
            {stats.salesByMonth.map((item, idx) => (
              <div key={idx} className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${Math.max((item.sales / maxSales) * 100, 5)}%` }}
                >
                  <span className="bar-value">{formatCurrency(item.sales)}</span>
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen adicional */}
      <div className="stats-summary">
        <div className="summary-card">
          <h3>🎯 Métricas Clave</h3>
          <ul className="metrics-list">
            <li>
              <span>Ticket promedio:</span>
              <strong>{formatCurrency(stats.metrics.avgTicket || 0)}</strong>
            </li>
            <li>
              <span>Subastas activas:</span>
              <strong>{stats.totalAuctions}</strong>
            </li>
            {stats.topProducts.length > 0 && (
              <li>
                <span>Producto más vendido:</span>
                <strong>{stats.topProducts[0]?.name || "N/A"}</strong>
              </li>
            )}
          </ul>
        </div>

        <div className="summary-card">
          <h3>📅 Órdenes Recientes</h3>
          {stats.recentOrders.length > 0 ? (
            <ul className="activity-list">
              {stats.recentOrders.map((order, idx) => (
                <li key={idx}>
                  <span className="activity-icon">🛒</span>
                  <span>
                    {order.order_number || `Pedido #${order.id}`} - {formatCurrency(order.total_minor)}
                  </span>
                  <small>{formatDate(order.created_at)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">No hay órdenes recientes</p>
          )}
        </div>
      </div>

      {/* Top productos */}
      {stats.topProducts.length > 0 && (
        <div className="stats-top-products">
          <h3>🏆 Productos Más Vendidos</h3>
          <ul className="top-products-list">
            {stats.topProducts.map((product, idx) => (
              <li key={idx}>
                <span className="rank">#{idx + 1}</span>
                <span className="product-name">{product.name}</span>
                <span className="quantity-sold">{product.quantity_sold} vendidos</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EstadisticasAdmin;
