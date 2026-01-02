import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const SubastaAdmin = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [auctionData, setAuctionData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    starting_price: "",
  });
  const [loading, setLoading] = useState(true);

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

  const handleSelectProduct = (product) => {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        { ...product, selectedSize: null },
      ]);
    }
  };

  const handleSizeChange = (productId, size) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, selectedSize: size } : p
      )
    );
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      Swal.fire("Advertencia", "Debes seleccionar al menos un producto", "warning");
      return;
    }

    const invalidProducts = selectedProducts.filter((p) => !p.selectedSize);
    if (invalidProducts.length > 0) {
      Swal.fire(
        "Advertencia",
        "Todos los productos deben tener un talle seleccionado",
        "warning"
      );
      return;
    }

    const auctionPayload = {
      ...auctionData,
      products: selectedProducts.map((p) => ({
        product_id: p.id,
        size: p.selectedSize,
      })),
    };

    try {
      await api.post("/auctions", auctionPayload);
      Swal.fire("Éxito", "Subasta creada correctamente", "success");
      
      // Reset form
      setAuctionData({
        title: "",
        start_date: "",
        end_date: "",
        starting_price: "",
      });
      setSelectedProducts([]);
    } catch (err) {
      console.error("Error al crear subasta:", err);
      Swal.fire("Error", "No se pudo crear la subasta.", "error");
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

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>
        ← Volver al Panel
      </button>
      <h2>🔨 Gestión de Subastas</h2>
      <p className="admin-subtitle">
        Crea una nueva subasta seleccionando los productos y talles disponibles
      </p>

      <form onSubmit={handleCreateAuction} className="admin-form">
        <div className="form-group">
          <label>Título de la Subasta</label>
          <input
            type="text"
            value={auctionData.title}
            onChange={(e) =>
              setAuctionData({ ...auctionData, title: e.target.value })
            }
            placeholder="Ej: Subasta de Zapatillas Deportivas Marzo 2025"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Inicio</label>
            <input
              type="datetime-local"
              value={auctionData.start_date}
              onChange={(e) =>
                setAuctionData({ ...auctionData, start_date: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de Cierre</label>
            <input
              type="datetime-local"
              value={auctionData.end_date}
              onChange={(e) =>
                setAuctionData({ ...auctionData, end_date: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Precio Inicial ($)</label>
          <input
            type="number"
            step="0.01"
            value={auctionData.starting_price}
            onChange={(e) =>
              setAuctionData({
                ...auctionData,
                starting_price: e.target.value,
              })
            }
            placeholder="0.00"
            required
          />
        </div>

        <hr />

        <h3>Productos Seleccionados ({selectedProducts.length})</h3>
        {selectedProducts.length === 0 ? (
          <p className="empty-text">⚠️ No has seleccionado ningún producto aún</p>
        ) : (
          <div className="selected-products-list">
            {selectedProducts.map((product) => (
              <div key={product.id} className="selected-product-item">
                <div className="product-info">
                  <strong>
                    {product.brand} {product.name}
                  </strong>
                  <span className="product-price">
                    ${(product.price_minor / 100).toFixed(2)}
                  </span>
                </div>
                <div className="size-selector">
                  <label>Talle:</label>
                  <select
                    value={product.selectedSize || ""}
                    onChange={(e) =>
                      handleSizeChange(product.id, e.target.value)
                    }
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {product.sizes?.map((size) => (
                      <option key={size.size} value={size.size}>
                        {size.size} (Stock: {size.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleSelectProduct(product)}
                  title="Quitar"
                >
                  ✗
                </button>
              </div>
            ))}
          </div>
        )}

        <hr />

        <h3>Catálogo de Productos</h3>
        <div className="products-grid">
          {products.map((product) => {
            const isSelected = selectedProducts.find((p) => p.id === product.id);
            return (
              <div
                key={product.id}
                className={`product-card ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectProduct(product)}
              >
                <div className="product-card-header">
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => {}}
                  />
                  <span className="product-id">#{product.id}</span>
                </div>
                <h4>{product.brand}</h4>
                <p className="product-model">{product.name}</p>
                <p className="product-price-tag">
                  ${(product.price_minor / 100).toFixed(2)}
                </p>
                <small className="product-sizes">
                  {product.sizes?.length || 0} talles disponibles
                </small>
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          <button type="submit" className="boton-verde">
            🔨 Crear Subasta
          </button>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => {
              setSelectedProducts([]);
              setAuctionData({
                title: "",
                start_date: "",
                end_date: "",
                starting_price: "",
              });
            }}
          >
            Limpiar Formulario
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubastaAdmin;
