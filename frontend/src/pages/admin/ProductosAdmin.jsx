import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";
import SizeStockModal from "../../components/admin/SizeStockModal"; // Importar el modal

const ProductosAdmin = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductForSizes, setSelectedProductForSizes] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      const data = response.data.data || response.data;
      setProducts(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      Swal.fire("Error", "No se pudo cargar la lista de productos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e08709",
      cancelButtonColor: "#71b100",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      Swal.fire("Éxito", "Producto eliminado correctamente", "success");
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      Swal.fire("Error", "No se pudo eliminar el producto.", "error");
    }
  };

  const handleManageSizes = (product) => {
    setSelectedProductForSizes(product);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    // Convertir precio a formato legible (pesos, no centavos)
    setEditingProduct({
      ...product,
      price_display: (product.price_minor / 100).toFixed(2)
    });
    setImagePreview(product.images?.[0] || null);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Permitir números y punto decimal
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setEditingProduct({
        ...editingProduct,
        price_display: value,
        price_minor: Math.round(parseFloat(value || 0) * 100)
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Guardar archivo para subir
    setEditingProduct({
      ...editingProduct,
      newImageFile: file
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Si hay nueva imagen, primero subirla
      if (editingProduct.newImageFile) {
        const formData = new FormData();
        formData.append('image', editingProduct.newImageFile);
        
        await api.post(`/products/${editingProduct.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Actualizar el resto de los datos del producto
      const updateData = {
        brand: editingProduct.brand,
        name: editingProduct.name,
        price_minor: editingProduct.price_minor,
        // El campo `available` no debe ser enviado, se calcula en el backend
        // `available: editingProduct.available`,
      };

      await api.put(`/products/${editingProduct.id}`, updateData);

      await fetchProducts();
      setEditingProduct(null);
      setImagePreview(null);
      Swal.fire("Éxito", "Producto actualizado correctamente", "success");
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      Swal.fire("Error", "No se pudo actualizar el producto.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>
          ← Volver
        </button>
        <p className="loading-text">🔄 Cargando productos...</p>
      </div>
    );
  }

  if (editingProduct) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={() => { setEditingProduct(null); setImagePreview(null); }}>
          ← Volver a la lista
        </button>
        <h2>Editar Producto</h2>
        <form onSubmit={handleSave} className="admin-form">
          {/* Imagen del producto */}
          <div className="form-group">
            <label>Imagen del Producto</label>
            <div className="image-upload-container">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="no-image-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="image-upload-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Cambiar Imagen
                </button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="brand">Marca</label>
            <input
              type="text"
              id="brand"
              value={editingProduct.brand || ""}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, brand: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Modelo</label>
            <input
              type="text"
              id="name"
              value={editingProduct.name || ""}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Precio ($)</label>
            <input
              type="text"
              id="price"
              inputMode="decimal"
              value={editingProduct.price_display || ""}
              onChange={handlePriceChange}
              placeholder="0.00"
              required
            />
            <small>Precio final con IVA incluido</small>
          </div>
          <div className="form-group">
            <label htmlFor="available">Disponible</label>
            <select
              id="available"
              value={editingProduct.available ? "true" : "false"}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  available: e.target.value === "true",
                })
              }
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="boton-verde" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              className="boton-secundario"
              onClick={() => { setEditingProduct(null); setImagePreview(null); }}
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
      <h2>Gestión de Productos</h2>
      <button className="boton-verde" style={{marginBottom: '20px'}} onClick={() => setEditingProduct({})}>
        + Crear Nuevo Producto
      </button>
      <p className="admin-subtitle">Total de productos: {products.length}</p>

      {products.length === 0 ? (
        <p className="empty-text">⚠️ No hay productos cargados.</p>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th>Talles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const imgSrc = product.images && product.images.length > 0 
                  ? product.images[0] 
                  : "/imagenes/default.png";
                return (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.src = "/imagenes/default.png";
                      }}
                    />
                  </td>
                  <td>{product.brand}</td>
                  <td>{product.name}</td>
                  <td>${(product.price_minor / 100).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.available ? "disponible" : "agotado"}`}>
                      {product.available ? "✓ Sí" : "✗ No"}
                    </span>
                  </td>
                  <td>{product.sizes?.length || 0}</td>
                  <td className="actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleManageSizes(product)}
                      title="Gestionar Talles"
                    >
                      📏
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(product)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(product.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <SizeStockModal 
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProductForSizes}
        onSizesUpdated={fetchProducts}
      />
    </div>
  );
};

export default ProductosAdmin;
