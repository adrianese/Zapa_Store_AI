import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./AdminCommon.css";

const DetallesEditor = ({ onBack }) => {
  const [detalles, setDetalles] = useState({ productos_deportivos: [] });
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchDetalles();
  }, []);

  const fetchDetalles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/detalles.json");
      const data = await response.json();
      setDetalles(data);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      Swal.fire("Error", "No se pudo cargar el archivo detalles.json", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditData({ ...detalles.productos_deportivos[index] });
  };

  const handleSave = () => {
    const updatedDetalles = { ...detalles };
    updatedDetalles.productos_deportivos[editingIndex] = editData;
    setDetalles(updatedDetalles);
    setEditingIndex(null);
    setEditData(null);

    // Mostrar JSON actualizado para copiar manualmente
    Swal.fire({
      title: "Actualizar detalles.json",
      html: `<p>Copia el siguiente contenido y actualiza manualmente el archivo <b>/public/detalles.json</b>:</p>
             <textarea readonly style="width:100%; height:300px; font-family:monospace; font-size:12px; padding:10px;">${JSON.stringify(
               updatedDetalles,
               null,
               2
             )}</textarea>`,
      icon: "info",
      confirmButtonColor: "#71b100",
      confirmButtonText: "Entendido",
    });
  };

  const handleAddBrand = () => {
    const newBrand = {
      marca: "Nueva Marca",
      actividad_apta: [],
      beneficios_materiales: [],
      descripcion_detallada:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
    };

    const updatedDetalles = { ...detalles };
    updatedDetalles.productos_deportivos.push(newBrand);
    setDetalles(updatedDetalles);

    Swal.fire("Éxito", "Nueva marca agregada. Recuerda guardar los cambios.", "success");
  };

  const handleDelete = (index) => {
    Swal.fire({
      title: "¿Eliminar esta marca?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e08709",
      cancelButtonColor: "#71b100",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedDetalles = { ...detalles };
        updatedDetalles.productos_deportivos.splice(index, 1);
        setDetalles(updatedDetalles);
        Swal.fire("Eliminado", "Marca eliminada correctamente", "success");
      }
    });
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

  if (editingIndex !== null) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => setEditingIndex(null)}>
          ← Volver a la lista
        </button>
        <h2>Editar Detalles de Marca</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="admin-form"
        >
          <div className="form-group">
            <label>Marca</label>
            <input
              type="text"
              value={editData.marca}
              onChange={(e) =>
                setEditData({ ...editData, marca: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Actividades Aptas (separadas por coma)</label>
            <input
              type="text"
              value={editData.actividad_apta.join(", ")}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  actividad_apta: e.target.value.split(",").map((s) => s.trim()),
                })
              }
              placeholder="Running, Trekking, Walking"
            />
          </div>

          <div className="form-group">
            <label>Beneficios de Materiales (separados por coma)</label>
            <textarea
              rows="3"
              value={editData.beneficios_materiales.join(", ")}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  beneficios_materiales: e.target.value
                    .split(",")
                    .map((s) => s.trim()),
                })
              }
              placeholder="Transpirable, Liviano, Resistente"
            />
          </div>

          <div className="form-group">
            <label>Descripción Detallada</label>
            <textarea
              rows="5"
              value={editData.descripcion_detallada}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  descripcion_detallada: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="boton-verde">
              Guardar Cambios
            </button>
            <button
              type="button"
              className="boton-secundario"
              onClick={() => setEditingIndex(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>
        ← Volver al Panel
      </button>
      <h2>Detalles de Marcas</h2>
      <p className="admin-subtitle">
        Edita la información de cada marca que aparece en la página de detalles
      </p>

      <button className="boton-agregar" onClick={handleAddBrand}>
        + Agregar Nueva Marca
      </button>

      {detalles.productos_deportivos.length === 0 ? (
        <p className="empty-text">⚠️ No hay marcas cargadas.</p>
      ) : (
        <div className="brands-list">
          {detalles.productos_deportivos.map((detalle, index) => (
            <div key={index} className="brand-card">
              <h3>{detalle.marca}</h3>
              <p>
                <strong>Actividades:</strong>{" "}
                {detalle.actividad_apta.join(", ") || "Sin especificar"}
              </p>
              <p>
                <strong>Beneficios:</strong>{" "}
                {detalle.beneficios_materiales.slice(0, 3).join(", ")}
                {detalle.beneficios_materiales.length > 3 ? "..." : ""}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {detalle.descripcion_detallada.substring(0, 100)}...
              </p>
              <div className="brand-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(index)}
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(index)}
                  title="Eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetallesEditor;
