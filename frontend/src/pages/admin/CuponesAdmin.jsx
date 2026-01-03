import { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';
import './AdminCommon.css';

const CuponesAdmin = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    usage_limit_per_user: '1',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, [filterStatus]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (search) params.append('search', search);
      
      const response = await api.get(`/coupons?${params.toString()}`);
      setCoupons(response.data.data?.data || response.data.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      Swal.fire('Error', 'No se pudieron cargar los cupones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      usage_limit: '',
      usage_limit_per_user: '1',
      starts_at: '',
      expires_at: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      min_purchase: coupon.min_purchase || '',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '',
      usage_limit_per_user: coupon.usage_limit_per_user || '1',
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : 1,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
        Swal.fire('¡Éxito!', 'Cupón actualizado correctamente', 'success');
      } else {
        await api.post('/coupons', payload);
        Swal.fire('¡Éxito!', 'Cupón creado correctamente', 'success');
      }
      
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar el cupón';
      Swal.fire('Error', message, 'error');
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await api.post(`/coupons/${coupon.id}/toggle`);
      Swal.fire('¡Éxito!', `Cupón ${coupon.is_active ? 'desactivado' : 'activado'}`, 'success');
      fetchCoupons();
    } catch (error) {
      Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    const result = await Swal.fire({
      title: '¿Eliminar cupón?',
      text: `El código ${coupon.code} será eliminado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/coupons/${coupon.id}`);
        Swal.fire('Eliminado', 'Cupón eliminado correctamente', 'success');
        fetchCoupons();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el cupón', 'error');
      }
    }
  };

  const handleGenerateBulk = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Generar cupones en lote',
      html: `
        <div style="text-align:left;padding:10px;">
          <label style="display:block;margin-bottom:5px;">Cantidad:</label>
          <input id="swal-quantity" type="number" min="1" max="100" value="10" class="swal2-input" style="width:100%">
          <label style="display:block;margin:10px 0 5px;">Prefijo:</label>
          <input id="swal-prefix" type="text" value="PROMO" maxlength="10" class="swal2-input" style="width:100%">
          <label style="display:block;margin:10px 0 5px;">Tipo:</label>
          <select id="swal-type" class="swal2-select" style="width:100%">
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto Fijo</option>
          </select>
          <label style="display:block;margin:10px 0 5px;">Valor:</label>
          <input id="swal-value" type="number" min="0.01" step="0.01" value="10" class="swal2-input" style="width:100%">
          <label style="display:block;margin:10px 0 5px;">Vencimiento (opcional):</label>
          <input id="swal-expires" type="datetime-local" class="swal2-input" style="width:100%">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => ({
        quantity: parseInt(document.getElementById('swal-quantity').value),
        prefix: document.getElementById('swal-prefix').value,
        type: document.getElementById('swal-type').value,
        value: parseFloat(document.getElementById('swal-value').value),
        expires_at: document.getElementById('swal-expires').value || null,
      }),
    });

    if (formValues) {
      try {
        const response = await api.post('/coupons/generate-bulk', formValues);
        Swal.fire('¡Éxito!', response.data.message, 'success');
        fetchCoupons();
      } catch (error) {
        Swal.fire('Error', 'No se pudieron generar los cupones', 'error');
      }
    }
  };

  const getStatusBadge = (coupon) => {
    const status = coupon.status || (coupon.is_active ? 'Activo' : 'Inactivo');
    const statusClasses = {
      'Activo': 'status-activo',
      'Inactivo': 'status-inactivo',
      'Expirado': 'status-expirado',
      'Agotado': 'status-agotado',
      'Programado': 'status-programado',
    };
    return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
  };

  const formatValue = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    }
    return `$${parseFloat(coupon.value).toLocaleString('es-AR')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="admin-section cupones-admin">
      <div className="section-header">
        <h2>🎟️ Gestión de Cupones</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleGenerateBulk}>
            📋 Generar en Lote
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            + Nuevo Cupón
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">🔍</button>
        </form>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="expired">Expirados</option>
          </select>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{coupons.length}</span>
          <span className="stat-label">Total Cupones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{coupons.filter(c => c.is_active).length}</span>
          <span className="stat-label">Activos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{coupons.reduce((sum, c) => sum + (c.times_used || 0), 0)}</span>
          <span className="stat-label">Usos Totales</span>
        </div>
      </div>

      {/* Tabla de cupones */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando cupones...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table coupons-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Descuento</th>
                <th>Usos</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-message">
                    No hay cupones registrados
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <code className="coupon-code">{coupon.code}</code>
                    </td>
                    <td>
                      <span className="coupon-description">
                        {coupon.description || '-'}
                      </span>
                      {coupon.min_purchase && (
                        <small className="min-purchase">
                          Min: ${parseFloat(coupon.min_purchase).toLocaleString('es-AR')}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="discount-value">{formatValue(coupon)}</span>
                      {coupon.type === 'percentage' && coupon.max_discount && (
                        <small className="max-discount">
                          Máx: ${parseFloat(coupon.max_discount).toLocaleString('es-AR')}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="usage-count">
                        {coupon.times_used || 0}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </span>
                    </td>
                    <td>
                      <div className="date-range">
                        {coupon.starts_at && (
                          <small>Desde: {formatDate(coupon.starts_at)}</small>
                        )}
                        {coupon.expires_at && (
                          <small>Hasta: {formatDate(coupon.expires_at)}</small>
                        )}
                        {!coupon.starts_at && !coupon.expires_at && (
                          <small>Sin límite</small>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(coupon)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openEditModal(coupon)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-toggle"
                          onClick={() => handleToggleStatus(coupon)}
                          title={coupon.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {coupon.is_active ? '🔴' : '🟢'}
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(coupon)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content coupon-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h3>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Código</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Dejar vacío para autogenerar"
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de descuento *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor * {formData.type === 'percentage' ? '(%)' : '($)'}</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    max={formData.type === 'percentage' ? '100' : '999999'}
                    required
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div className="form-group">
                    <label>Descuento máximo ($)</label>
                    <input
                      type="number"
                      name="max_discount"
                      value={formData.max_discount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Sin límite"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ej: Descuento de bienvenida"
                  maxLength={255}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Compra mínima ($)</label>
                  <input
                    type="number"
                    name="min_purchase"
                    value={formData.min_purchase}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Sin mínimo"
                  />
                </div>
                <div className="form-group">
                  <label>Límite de usos total</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Usos por usuario</label>
                  <input
                    type="number"
                    name="usage_limit_per_user"
                    value={formData.usage_limit_per_user}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Cupón activo
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha inicio</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={formData.starts_at}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha expiración</label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuponesAdmin;
