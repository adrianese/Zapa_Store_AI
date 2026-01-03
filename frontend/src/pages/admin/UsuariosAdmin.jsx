import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const UsuariosAdmin = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const data = response.data.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      Swal.fire("Error", "No se pudieron cargar los usuarios.", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0) return { text: "Usuario", class: "role-user" };
    const roleName = roles[0]?.name || roles[0];
    const badges = {
      admin: { text: "👑 Admin", class: "role-admin" },
      seller: { text: "🏪 Vendedor", class: "role-seller" },
      user: { text: "👤 Usuario", class: "role-user" },
    };
    return badges[roleName] || { text: roleName, class: "role-user" };
  };

  const getStatusBadge = (user) => {
    if (user.deleted_at) return { text: "❌ Eliminado", class: "status-deleted" };
    if (user.is_active === false) return { text: "⏸️ Inactivo", class: "status-inactive" };
    return { text: "✅ Activo", class: "status-active" };
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.post(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, roles: [{ name: newRole }] } : u
      ));
      Swal.fire("Éxito", `Rol cambiado a ${newRole}`, "success");
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      Swal.fire("Error", "No se pudo cambiar el rol.", "error");
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activar" : "desactivar";
    
    const result = await Swal.fire({
      title: `¿${newStatus ? "Activar" : "Desactivar"} usuario?`,
      text: `El usuario ${newStatus ? "podrá" : "no podrá"} acceder al sistema.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus ? "#71b100" : "#e08709",
      cancelButtonColor: "#999",
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/users/${userId}`, { is_active: newStatus });
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_active: newStatus } : u
        ));
        Swal.fire("Éxito", `Usuario ${newStatus ? "activado" : "desactivado"}`, "success");
      } catch (err) {
        console.error("Error al cambiar estado:", err);
        Swal.fire("Error", "No se pudo cambiar el estado.", "error");
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      html: `Esta acción eliminará permanentemente a <strong>${userName}</strong>.<br/>Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#999",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(prev => prev.filter(u => u.id !== userId));
        Swal.fire("Eliminado", "Usuario eliminado correctamente.", "success");
      } catch (err) {
        console.error("Error al eliminar:", err);
        Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}`, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || null,
      });
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? selectedUser : u
      ));
      setEditMode(false);
      setSelectedUser(null);
      Swal.fire("Éxito", "Usuario actualizado correctamente.", "success");
    } catch (err) {
      console.error("Error al actualizar:", err);
      Swal.fire("Error", "No se pudo actualizar el usuario.", "error");
    }
  };

  const filteredUsers = users.filter(user => {
    // Filtro por rol
    if (filter !== "all") {
      const userRole = user.roles?.[0]?.name || user.roles?.[0] || "user";
      if (filter === "inactive" && user.is_active !== false) return false;
      else if (filter !== "inactive" && userRole !== filter) return false;
    }
    
    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.id?.toString().includes(term)
      );
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando usuarios...</p>
      </div>
    );
  }

  // Vista de edición de usuario
  if (editMode && selectedUser) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => { setEditMode(false); setSelectedUser(null); }}>
          ← Volver a la lista
        </button>
        <h2>✏️ Editar Usuario</h2>
        
        <form className="admin-form user-edit-form" onSubmit={handleUpdateUser}>
          <div className="form-group">
            <label>ID</label>
            <input type="text" value={selectedUser.id} disabled />
          </div>
          
          <div className="form-group">
            <label>Nombre</label>
            <input 
              type="text" 
              value={selectedUser.name || ""} 
              onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={selectedUser.email || ""} 
              onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono</label>
            <input 
              type="text" 
              value={selectedUser.phone || ""} 
              onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
              placeholder="Ej: +54 11 1234-5678"
            />
          </div>
          
          <div className="form-group">
            <label>Rol</label>
            <select 
              value={selectedUser.roles?.[0]?.name || selectedUser.roles?.[0] || "user"}
              onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
            >
              <option value="user">👤 Usuario</option>
              <option value="seller">🏪 Vendedor</option>
              <option value="admin">👑 Admin</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Registrado</label>
            <input type="text" value={formatDate(selectedUser.created_at)} disabled />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="boton-verde">💾 Guardar Cambios</button>
            <button type="button" className="boton-cancelar" onClick={() => { setEditMode(false); setSelectedUser(null); }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Vista de detalle de usuario
  if (selectedUser && !editMode) {
    const roleBadge = getRoleBadge(selectedUser.roles);
    const statusBadge = getStatusBadge(selectedUser);
    
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => setSelectedUser(null)}>
          ← Volver a la lista
        </button>
        <h2>👤 Detalle de Usuario</h2>
        
        <div className="user-detail-card">
          <div className="user-detail-header">
            <div className="user-avatar">
              {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="user-info">
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>
              <div className="user-badges">
                <span className={`badge ${roleBadge.class}`}>{roleBadge.text}</span>
                <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
              </div>
            </div>
          </div>
          
          <div className="user-detail-body">
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedUser.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-value">{selectedUser.phone || "No registrado"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Registrado:</span>
              <span className="detail-value">{formatDate(selectedUser.created_at)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Última actualización:</span>
              <span className="detail-value">{formatDate(selectedUser.updated_at)}</span>
            </div>
            {selectedUser.wallet_address && (
              <div className="detail-row">
                <span className="detail-label">Wallet:</span>
                <span className="detail-value wallet-address">
                  {selectedUser.wallet_address.slice(0, 6)}...{selectedUser.wallet_address.slice(-4)}
                </span>
              </div>
            )}
          </div>
          
          <div className="user-detail-actions">
            <button className="boton-verde" onClick={() => setEditMode(true)}>
              ✏️ Editar
            </button>
            <button 
              className={selectedUser.is_active !== false ? "boton-warning" : "boton-success"}
              onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active !== false)}
            >
              {selectedUser.is_active !== false ? "⏸️ Desactivar" : "▶️ Activar"}
            </button>
            <button 
              className="boton-danger"
              onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal - Lista de usuarios
  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>👥 Gestión de Usuarios</h2>
      <p className="admin-subtitle">Total de usuarios: {users.length}</p>

      <div className="users-toolbar">
        <div className="search-box">
          <input 
            type="text"
            placeholder="🔍 Buscar por nombre, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <label>Filtrar:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="admin">👑 Admins</option>
            <option value="seller">🏪 Vendedores</option>
            <option value="user">👤 Usuarios</option>
            <option value="inactive">⏸️ Inactivos</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="empty-text">⚠️ No hay usuarios que coincidan con los filtros.</p>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const roleBadge = getRoleBadge(user.roles);
                const statusBadge = getStatusBadge(user);
                return (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-mini-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        className={`role-select ${roleBadge.class}`}
                        value={user.roles?.[0]?.name || user.roles?.[0] || "user"}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="user">👤 Usuario</option>
                        <option value="seller">🏪 Vendedor</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-action btn-view" 
                        title="Ver detalle"
                        onClick={() => setSelectedUser(user)}
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-action btn-edit" 
                        title="Editar"
                        onClick={() => { setSelectedUser(user); setEditMode(true); }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-action btn-toggle" 
                        title={user.is_active !== false ? "Desactivar" : "Activar"}
                        onClick={() => handleToggleActive(user.id, user.is_active !== false)}
                      >
                        {user.is_active !== false ? "⏸️" : "▶️"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;
