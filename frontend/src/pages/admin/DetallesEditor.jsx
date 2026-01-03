import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const DetallesEditor = ({ onBack }) => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [brandsWithoutDetails, setBrandsWithoutDetails] = useState([]);

  useEffect(() => {
    fetchDetalles();
    fetchBrandsWithoutDetails();
  }, []);

  const fetchDetalles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-details/admin");
      setDetalles(response.data.productos_deportivos || []);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      Swal.fire("Error", "No se pudieron cargar los detalles de marca", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandsWithoutDetails = async () => {
    try {
      const response = await api.get("/brand-details/without-details");
      setBrandsWithoutDetails(response.data.brands || []);
    } catch (err) {
      console.error("Error al cargar marcas sin detalles:", err);
    }
  };

  const handleEdit = (detail) => {
    setEditingId(detail.id);
    setEditData({ ...detail });
  };

  const handleSave = async () => {
    try {
      const dataToSend = {
        marca: editData.marca,
        actividad_apta: editData.actividad_apta || [],
        beneficios_materiales: editData.beneficios_materiales || [],
        descripcion_detallada: editData.descripcion_detallada || "",
        is_active: editData.is_active ?? true,
      };

      if (editingId === "new") {
        await api.post("/brand-details", dataToSend);
        Swal.fire("Éxito", "Marca creada correctamente", "success");
      } else {
        await api.put(`/brand-details/${editingId}`, dataToSend);
        Swal.fire("Éxito", "Marca actualizada correctamente", "success");
      }

      setEditingId(null);
      setEditData(null);
      fetchDetalles();
      fetchBrandsWithoutDetails();
    } catch (err) {
      console.error("Error al guardar:", err);
      const message = err.response?.data?.message || "Error al guardar los cambios";
      Swal.fire("Error", message, "error");
    }
  };

  const handleAddBrand = (brandName = "Nueva Marca") => {
    setEditingId("new");
    setEditData({
      marca: brandName,
      actividad_apta: [],
      beneficios_materiales: [],
      descripcion_detallada: "",
      is_active: true,
    });
  };

  const handleDelete = async (detail) => {
    const result = await Swal.fire({
      title: "¿Eliminar esta marca?",
      text: `Se eliminará "${detail.marca}" de la base de datos`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e53e3e",
      cancelButtonColor: "#718096",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/brand-details/${detail.id}`);
        Swal.fire("Eliminado", "Marca eliminada correctamente", "success");
        fetchDetalles();
        fetchBrandsWithoutDetails();
      } catch (err) {
        console.error("Error al eliminar:", err);
        Swal.fire("Error", "No se pudo eliminar la marca", "error");
      }
    }
  };

  const handleToggleActive = async (detail) => {
    try {
      await api.put(`/brand-details/${detail.id}`, {
        is_active: !detail.is_active,
      });
      fetchDetalles();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  // Formatear array para textarea (un item por línea)
  const arrayToText = (arr) => {
    if (!arr || !Array.isArray(arr)) return "";
    return arr.join("\n");
  };

  // Parsear textarea a array (por línea)
  const textToArray = (text) => {
    if (!text) return [];
    return text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>
          ← Volver
        </button>
        <p className="loading-text">🔄 Cargando detalles de marcas...</p>
      </div>
    );
  }

  // Formulario de edición/creación
  if (editingId !== null) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => { setEditingId(null); setEditData(null); }}>
          ← Volver a la lista
        </button>
        <h2>{editingId === "new" ? "Nueva Marca" : "Editar Marca"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="admin-form"
        >
          <div className="form-group">
            <label>Marca *</label>
            <input
              type="text"
              value={editData.marca || ""}
              onChange={(e) => setEditData({ ...editData, marca: e.target.value })}
              required
              placeholder="Nombre de la marca"
            />
          </div>

          <div className="form-group">
            <label>Actividades Aptas (una por línea)</label>
            <textarea
              rows="4"
              value={arrayToText(editData.actividad_apta)}
              onChange={(e) => setEditData({
                ...editData,
                actividad_apta: textToArray(e.target.value),
              })}
              placeholder="Running&#10;Trekking&#10;Walking"
            />
            <small className="form-hint">Escribe cada actividad o descripción en una línea separada</small>
          </div>

          <div className="form-group">
            <label>Beneficios de Materiales (uno por línea)</label>
            <textarea
              rows="4"
              value={arrayToText(editData.beneficios_materiales)}
              onChange={(e) => setEditData({
                ...editData,
                beneficios_materiales: textToArray(e.target.value),
              })}
              placeholder="Material transpirable&#10;Suela de goma&#10;Plantilla ergonómica"
            />
            <small className="form-hint">Escribe cada beneficio en una línea separada</small>
          </div>

          <div className="form-group">
            <label>Descripción Detallada</label>
            <textarea
              rows="5"
              value={editData.descripcion_detallada || ""}
              onChange={(e) => setEditData({
                ...editData,
                descripcion_detallada: e.target.value,
              })}
              placeholder="Descripción general de la marca..."
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={editData.is_active ?? true}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              />
              Marca activa (visible en la tienda)
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="boton-verde">
              {editingId === "new" ? "Crear Marca" : "Guardar Cambios"}
            </button>
            <button
              type="button"
              className="boton-secundario"
              onClick={() => { setEditingId(null); setEditData(null); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Lista de marcas
  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>
        ← Volver al Panel
      </button>
      <h2>Detalles de Marcas</h2>
      <p className="admin-subtitle">
        Administra la información de cada marca que aparece en los detalles de productos
      </p>

      <div className="admin-actions-bar">
        <button className="boton-agregar" onClick={() => handleAddBrand()}>
          + Nueva Marca
        </button>

        {brandsWithoutDetails.length > 0 && (
          <div className="brands-suggestions">
            <span className="suggestion-label">Marcas sin detalles:</span>
            {brandsWithoutDetails.slice(0, 5).map((brand) => (
              <button
                key={brand}
                className="btn-suggestion"
                onClick={() => handleAddBrand(brand)}
                title={`Crear detalles para ${brand}`}
              >
                + {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {detalles.length === 0 ? (
        <p className="empty-text">⚠️ No hay marcas cargadas en la base de datos.</p>
      ) : (
        <div className="brands-list">
          {detalles.map((detalle) => (
            <div key={detalle.id} className={`brand-card ${!detalle.is_active ? 'inactive' : ''}`}>
              <div className="brand-header">
                <h3>{detalle.marca || 'Sin marca'}</h3>
                <span className={`status-badge ${detalle.is_active ? 'active' : 'inactive'}`}>
                  {detalle.is_active ? '✓ Activa' : '○ Inactiva'}
                </span>
              </div>
              <p>
                <strong>Actividades:</strong>{" "}
                {detalle.actividad_apta?.length > 0 
                  ? `${detalle.actividad_apta.length} descripción(es)`
                  : "Sin especificar"}
              </p>
              <p>
                <strong>Beneficios:</strong>{" "}
                {detalle.beneficios_materiales?.length > 0
                  ? `${detalle.beneficios_materiales.length} beneficio(s)`
                  : "Sin especificar"}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {detalle.descripcion_detallada 
                  ? `${detalle.descripcion_detallada.substring(0, 80)}...`
                  : "Sin descripción"}
              </p>
              <div className="brand-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(detalle)}
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  className={`btn-toggle ${detalle.is_active ? 'active' : ''}`}
                  onClick={() => handleToggleActive(detalle)}
                  title={detalle.is_active ? 'Desactivar' : 'Activar'}
                >
                  {detalle.is_active ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(detalle)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-stats">
        <p>Total: <strong>{detalles.length}</strong> marcas | 
           Activas: <strong>{detalles.filter(d => d.is_active).length}</strong> | 
           Inactivas: <strong>{detalles.filter(d => !d.is_active).length}</strong>
        </p>
      </div>
    </div>
  );
};

export default DetallesEditor;
