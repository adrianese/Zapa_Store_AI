import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const SubastaAdmin = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [auctionData, setAuctionData] = useState({
    start_at: "",
    end_at: "",
    starting_bid: "",
    reserve_price: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showList, setShowList] = useState(true);
  
  // Nuevo producto manual
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    brand: "",
    name: "",
    quantity: 1,
    sizeType: "single", // 'single', 'multiple', 'range'
    selectedSize: "",
    selectedSizes: [],
    sizeRangeFrom: "",
    sizeRangeTo: "",
    price: "",
  });

  // Lista de talles comunes
  const commonSizes = [
    "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", 
    "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", 
    "43", "43.5", "44", "44.5", "45", "45.5", "46"
  ];

  // Marcas populares para autocompletado
  const popularBrands = [
    "Nike", "Adidas", "Jordan", "New Balance", "Puma", "Reebok", 
    "Converse", "Vans", "Asics", "Under Armour", "Fila", "Skechers"
  ];

  useEffect(() => {
    fetchProducts();
    fetchAuctions();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      const data = response.data.data || response.data;
      setProducts(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await api.get("/auctions");
      const data = response.data.data?.data || response.data.data || [];
      setAuctions(data);
    } catch (err) {
      console.error("Error al cargar subastas:", err);
    }
  };

  // Agregar producto existente
  const handleSelectProduct = (product) => {
    const exists = selectedProducts.find((p) => p.id === product.id && !p.isNew);
    if (exists) {
      setSelectedProducts((prev) => prev.filter((p) => !(p.id === product.id && !p.isNew)));
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        { 
          ...product, 
          selectedSize: null,
          selectedSizes: [],
          quantity: 1,
          isNew: false 
        },
      ]);
    }
  };

  // Cambiar talle de producto seleccionado
  const handleSizeChange = (index, size) => {
    setSelectedProducts((prev) =>
      prev.map((p, i) => i === index ? { ...p, selectedSize: size } : p)
    );
  };

  // Cambiar cantidad de producto seleccionado
  const handleQuantityChange = (index, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((p, i) => i === index ? { ...p, quantity: Math.max(1, parseInt(quantity) || 1) } : p)
    );
  };

  // Toggle talle en selección múltiple
  const handleToggleSize = (index, size) => {
    setSelectedProducts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const sizes = p.selectedSizes || [];
        if (sizes.includes(size)) {
          return { ...p, selectedSizes: sizes.filter(s => s !== size) };
        } else {
          return { ...p, selectedSizes: [...sizes, size].sort((a, b) => parseFloat(a) - parseFloat(b)) };
        }
      })
    );
  };

  // Agregar producto nuevo manualmente
  const handleAddNewProduct = () => {
    if (!newProduct.brand.trim() || !newProduct.name.trim()) {
      Swal.fire("Error", "Debes ingresar marca y modelo", "warning");
      return;
    }

    let sizes = [];
    if (newProduct.sizeType === "single" && newProduct.selectedSize) {
      sizes = [newProduct.selectedSize];
    } else if (newProduct.sizeType === "multiple") {
      sizes = newProduct.selectedSizes;
    } else if (newProduct.sizeType === "range" && newProduct.sizeRangeFrom && newProduct.sizeRangeTo) {
      const from = parseFloat(newProduct.sizeRangeFrom);
      const to = parseFloat(newProduct.sizeRangeTo);
      sizes = commonSizes.filter(s => {
        const num = parseFloat(s);
        return num >= from && num <= to;
      });
    }

    if (sizes.length === 0) {
      Swal.fire("Error", "Debes seleccionar al menos un talle", "warning");
      return;
    }

    const tempId = `new_${Date.now()}`;
    const newProductItem = {
      id: tempId,
      brand: newProduct.brand.trim(),
      name: newProduct.name.trim(),
      price_minor: newProduct.price ? Math.round(parseFloat(newProduct.price) * 100) : 0,
      quantity: newProduct.quantity,
      selectedSize: sizes.length === 1 ? sizes[0] : null,
      selectedSizes: sizes,
      sizes: sizes.map(s => ({ size: s, stock: newProduct.quantity })),
      isNew: true,
    };

    setSelectedProducts((prev) => [...prev, newProductItem]);
    
    // Reset form
    setNewProduct({
      brand: "",
      name: "",
      quantity: 1,
      sizeType: "single",
      selectedSize: "",
      selectedSizes: [],
      sizeRangeFrom: "",
      sizeRangeTo: "",
      price: "",
    });
    setShowNewProduct(false);
    
    Swal.fire({
      title: "Producto agregado",
      text: `${newProductItem.brand} ${newProductItem.name} - Talles: ${sizes.join(", ")}`,
      icon: "success",
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Toggle talle en nuevo producto
  const handleNewProductToggleSize = (size) => {
    setNewProduct(prev => {
      const sizes = prev.selectedSizes;
      if (sizes.includes(size)) {
        return { ...prev, selectedSizes: sizes.filter(s => s !== size) };
      } else {
        return { ...prev, selectedSizes: [...sizes, size].sort((a, b) => parseFloat(a) - parseFloat(b)) };
      }
    });
  };

  // Quitar producto de la selección
  const handleRemoveProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Crear subasta
  const handleCreateAuction = async (e) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      Swal.fire("Advertencia", "Debes seleccionar al menos un producto", "warning");
      return;
    }

    // Validar que todos tengan talle seleccionado
    const withoutSize = selectedProducts.filter(p => 
      !p.selectedSize && (!p.selectedSizes || p.selectedSizes.length === 0)
    );
    if (withoutSize.length > 0) {
      Swal.fire("Advertencia", "Todos los productos deben tener al menos un talle seleccionado", "warning");
      return;
    }

    const startDate = new Date(auctionData.start_at);
    const endDate = new Date(auctionData.end_at);

    if (endDate <= startDate) {
      Swal.fire("Error", "La fecha de cierre debe ser posterior a la de inicio", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Primero crear productos nuevos si los hay
      const newProducts = selectedProducts.filter(p => p.isNew);
      const existingProducts = selectedProducts.filter(p => !p.isNew);
      
      const createdProductIds = [];
      
      for (const product of newProducts) {
        try {
          // Crear producto en backend
          const productPayload = {
            brand: product.brand,
            name: product.name,
            price_minor: product.price_minor || 0,
            stock: product.quantity,
            sizes: product.sizes || [],
            available: true,
          };
          
          const response = await api.post("/products", productPayload);
          const createdProduct = response.data.data || response.data;
          createdProductIds.push(createdProduct.id);
        } catch (err) {
          console.error("Error creando producto:", err);
          throw new Error(`Error al crear producto: ${product.brand} ${product.name}`);
        }
      }

      // IDs de productos existentes
      const existingProductIds = existingProducts.map(p => p.id);
      
      // Payload de la subasta
      // Usar el primer producto seleccionado (o creado) como product_id
      const allProductIds = [...existingProductIds, ...createdProductIds];
      const auctionPayload = {
        product_id: allProductIds[0],
        start_at: auctionData.start_at,
        end_at: auctionData.end_at,
        starting_bid_minor: Math.round(parseFloat(auctionData.starting_bid) * 100),
        reserve_price_minor: auctionData.reserve_price 
          ? Math.round(parseFloat(auctionData.reserve_price) * 100) 
          : null,
        status: auctionData.status,
      };

      const response = await api.post("/auctions", auctionPayload);
      
      Swal.fire({
        title: "¡Subasta Creada!",
        html: `
          <p>La subasta se ha creado correctamente.</p>
          <p><strong>ID:</strong> ${response.data.data?.id || 'N/A'}</p>
          <p><strong>Productos:</strong> ${selectedProducts.length}</p>
          ${newProducts.length > 0 ? `<p><strong>Nuevos creados:</strong> ${newProducts.length}</p>` : ''}
        `,
        icon: "success",
        confirmButtonColor: "#10b981"
      });
      
      resetForm();
      fetchProducts();
      fetchAuctions();
      setShowList(true);
    } catch (err) {
      console.error("Error al crear subasta:", err);
      Swal.fire("Error", err.message || "No se pudo crear la subasta.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAuctionData({
      start_at: "",
      end_at: "",
      starting_bid: "",
      reserve_price: "",
      status: "pending",
    });
    setSelectedProducts([]);
    setShowNewProduct(false);
  };

  const handleDeleteAuction = async (auctionId) => {
    const result = await Swal.fire({
      title: "¿Eliminar subasta?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/auctions/${auctionId}`);
        Swal.fire("Eliminada", "La subasta ha sido eliminada", "success");
        fetchAuctions();
      } catch (err) {
        Swal.fire("Error", "No se pudo eliminar la subasta", "error");
      }
    }
  };

  const handleActivateAuction = async (auctionId) => {
    try {
      await api.post(`/auctions/${auctionId}/resume`);
      Swal.fire("Activada", "La subasta está ahora activa", "success");
      fetchAuctions();
    } catch (err) {
      Swal.fire("Error", "No se pudo activar la subasta", "error");
    }
  };

  const handlePauseAuction = async (auctionId) => {
    try {
      await api.post(`/auctions/${auctionId}/pause`);
      Swal.fire("Pausada", "La subasta ha sido pausada", "info");
      fetchAuctions();
    } catch (err) {
      Swal.fire("Error", "No se pudo pausar la subasta", "error");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { emoji: "🟡", text: "Pendiente", class: "badge-warning" },
      active: { emoji: "🟢", text: "Activa", class: "badge-success" },
      paused: { emoji: "⏸️", text: "Pausada", class: "badge-info" },
      finished: { emoji: "🏁", text: "Finalizada", class: "badge-secondary" },
      cancelled: { emoji: "❌", text: "Cancelada", class: "badge-danger" },
    };
    return badges[status] || { emoji: "❓", text: status, class: "" };
  };

  const formatPrice = (minor) => {
    if (!minor) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(minor / 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>🔨 Gestión de Subastas</h2>
      
      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${showList ? 'active' : ''}`}
          onClick={() => setShowList(true)}
        >
          📋 Lista ({auctions.length})
        </button>
        <button 
          className={`tab-btn ${!showList ? 'active' : ''}`}
          onClick={() => setShowList(false)}
        >
          ➕ Nueva Subasta
        </button>
      </div>

      {/* Lista de subastas */}
      {showList ? (
        <div className="auctions-list">
          {auctions.length === 0 ? (
            <div className="empty-state">
              <p>🔨 No hay subastas creadas</p>
              <button className="boton-verde" onClick={() => setShowList(false)}>
                Crear Primera Subasta
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Productos</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Precio Inicial</th>
                  <th>Oferta Actual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction) => {
                  const status = getStatusBadge(auction.status);
                  return (
                    <tr key={auction.id}>
                      <td>#{auction.id}</td>
                      <td>{auction.products?.length || 1}</td>
                      <td>{formatDate(auction.start_at)}</td>
                      <td>{formatDate(auction.end_at)}</td>
                      <td>{formatPrice(auction.starting_bid_minor)}</td>
                      <td>{formatPrice(auction.current_bid_minor)}</td>
                      <td>
                        <span className={`badge ${status.class}`}>
                          {status.emoji} {status.text}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {auction.status === 'pending' && (
                          <button className="btn-small btn-success" onClick={() => handleActivateAuction(auction.id)} title="Activar">▶️</button>
                        )}
                        {auction.status === 'active' && (
                          <button className="btn-small btn-warning" onClick={() => handlePauseAuction(auction.id)} title="Pausar">⏸️</button>
                        )}
                        {auction.status === 'paused' && (
                          <button className="btn-small btn-success" onClick={() => handleActivateAuction(auction.id)} title="Reanudar">▶️</button>
                        )}
                        {['pending', 'paused'].includes(auction.status) && (
                          <button className="btn-small btn-danger" onClick={() => handleDeleteAuction(auction.id)} title="Eliminar">🗑️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Formulario de creación */
        <form onSubmit={handleCreateAuction} className="admin-form">
          
          {/* Configuración de fechas */}
          <div className="form-section">
            <h3>📅 Configuración</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha y Hora de Inicio *</label>
                <input
                  type="datetime-local"
                  value={auctionData.start_at}
                  onChange={(e) => setAuctionData({ ...auctionData, start_at: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha y Hora de Cierre *</label>
                <input
                  type="datetime-local"
                  value={auctionData.end_at}
                  onChange={(e) => setAuctionData({ ...auctionData, end_at: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio Inicial (ARS) *</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={auctionData.starting_bid}
                  onChange={(e) => setAuctionData({ ...auctionData, starting_bid: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio de Reserva (ARS)</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={auctionData.reserve_price}
                  onChange={(e) => setAuctionData({ ...auctionData, reserve_price: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado Inicial</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={auctionData.status === "pending"}
                    onChange={(e) => setAuctionData({ ...auctionData, status: e.target.value })}
                  />
                  <span className="radio-text">🟡 Pendiente (publicar después)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={auctionData.status === "active"}
                    onChange={(e) => setAuctionData({ ...auctionData, status: e.target.value })}
                  />
                  <span className="radio-text">🟢 Activa (publicar al inicio)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Productos seleccionados */}
          <div className="form-section">
            <div className="section-header">
              <h3>👟 Productos para Subastar ({selectedProducts.length})</h3>
              <button 
                type="button" 
                className="btn-add-new"
                onClick={() => setShowNewProduct(!showNewProduct)}
              >
                {showNewProduct ? '✕ Cancelar' : '➕ Agregar Manualmente'}
              </button>
            </div>

            {/* Formulario para nuevo producto */}
            {showNewProduct && (
              <div className="new-product-form">
                <h4>🆕 Nuevo Producto</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Marca *</label>
                    <input
                      type="text"
                      list="brands-list"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="Ej: Nike, Adidas..."
                    />
                    <datalist id="brands-list">
                      {popularBrands.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Modelo *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ej: Air Max 90, Ultraboost..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad de Pares</label>
                    <input
                      type="number"
                      min="1"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio de Referencia (ARS)</label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Selección de Talles</label>
                  <div className="size-type-selector">
                    <label className="size-type-option">
                      <input
                        type="radio"
                        name="sizeType"
                        value="single"
                        checked={newProduct.sizeType === "single"}
                        onChange={(e) => setNewProduct({ ...newProduct, sizeType: e.target.value })}
                      />
                      <span>Un solo talle</span>
                    </label>
                    <label className="size-type-option">
                      <input
                        type="radio"
                        name="sizeType"
                        value="multiple"
                        checked={newProduct.sizeType === "multiple"}
                        onChange={(e) => setNewProduct({ ...newProduct, sizeType: e.target.value })}
                      />
                      <span>Múltiples talles</span>
                    </label>
                    <label className="size-type-option">
                      <input
                        type="radio"
                        name="sizeType"
                        value="range"
                        checked={newProduct.sizeType === "range"}
                        onChange={(e) => setNewProduct({ ...newProduct, sizeType: e.target.value })}
                      />
                      <span>Rango de talles</span>
                    </label>
                  </div>
                </div>

                {/* Talle único */}
                {newProduct.sizeType === "single" && (
                  <div className="form-group">
                    <label>Talle</label>
                    <select
                      value={newProduct.selectedSize}
                      onChange={(e) => setNewProduct({ ...newProduct, selectedSize: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {commonSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Múltiples talles */}
                {newProduct.sizeType === "multiple" && (
                  <div className="form-group">
                    <label>Selecciona los talles disponibles</label>
                    <div className="sizes-grid">
                      {commonSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          className={`size-chip ${newProduct.selectedSizes.includes(size) ? 'selected' : ''}`}
                          onClick={() => handleNewProductToggleSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {newProduct.selectedSizes.length > 0 && (
                      <small className="selected-sizes-text">
                        Seleccionados: {newProduct.selectedSizes.join(", ")}
                      </small>
                    )}
                  </div>
                )}

                {/* Rango de talles */}
                {newProduct.sizeType === "range" && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Desde</label>
                      <select
                        value={newProduct.sizeRangeFrom}
                        onChange={(e) => setNewProduct({ ...newProduct, sizeRangeFrom: e.target.value })}
                      >
                        <option value="">Desde...</option>
                        {commonSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hasta</label>
                      <select
                        value={newProduct.sizeRangeTo}
                        onChange={(e) => setNewProduct({ ...newProduct, sizeRangeTo: e.target.value })}
                      >
                        <option value="">Hasta...</option>
                        {commonSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button 
                  type="button" 
                  className="boton-verde"
                  onClick={handleAddNewProduct}
                >
                  ✓ Agregar Producto
                </button>
              </div>
            )}

            {/* Lista de productos seleccionados */}
            {selectedProducts.length === 0 ? (
              <p className="empty-text">⚠️ Selecciona productos del catálogo o agrégalos manualmente</p>
            ) : (
              <div className="selected-products-list">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="selected-product-card">
                    <div className="product-main-info">
                      {product.isNew && <span className="new-badge">NUEVO</span>}
                      <strong>{product.brand} {product.name}</strong>
                      {product.price_minor > 0 && (
                        <span className="product-ref-price">{formatPrice(product.price_minor)}</span>
                      )}
                    </div>
                    
                    <div className="product-config">
                      {/* Cantidad */}
                      <div className="config-item">
                        <label>Cant:</label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity || 1}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="quantity-input"
                        />
                      </div>

                      {/* Talle(s) */}
                      <div className="config-item sizes-config">
                        <label>Talle(s):</label>
                        {product.selectedSizes && product.selectedSizes.length > 1 ? (
                          <span className="sizes-display">{product.selectedSizes.join(", ")}</span>
                        ) : (
                          <select
                            value={product.selectedSize || ""}
                            onChange={(e) => handleSizeChange(index, e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {(product.sizes || commonSizes.map(s => ({size: s}))).map((size) => (
                              <option key={size.size || size} value={size.size || size}>
                                {size.size || size} {size.stock ? `(${size.stock})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-remove-product"
                      onClick={() => handleRemoveProduct(index)}
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catálogo de productos existentes */}
          <div className="form-section">
            <h3>🛍️ Catálogo de Productos Existentes</h3>
            <p className="section-hint">Click en un producto para agregarlo a la subasta</p>
            <div className="products-grid">
              {products.map((product) => {
                const isSelected = selectedProducts.find((p) => p.id === product.id && !p.isNew);
                return (
                  <div
                    key={product.id}
                    className={`product-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="product-card-header">
                      <input type="checkbox" checked={!!isSelected} onChange={() => {}} />
                      <span className="product-id">#{product.id}</span>
                    </div>
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} className="product-thumb" />
                    )}
                    <h4>{product.brand}</h4>
                    <p className="product-model">{product.name}</p>
                    <p className="product-price-tag">{formatPrice(product.price_minor)}</p>
                    <small className="product-sizes">{product.sizes?.length || 0} talles</small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="boton-verde"
              disabled={submitting || selectedProducts.length === 0}
            >
              {submitting ? "⏳ Creando..." : "🔨 Crear Subasta"}
            </button>
            <button type="button" className="boton-secundario" onClick={resetForm}>
              Limpiar
            </button>
            <button type="button" className="boton-secundario" onClick={() => setShowList(true)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SubastaAdmin;
