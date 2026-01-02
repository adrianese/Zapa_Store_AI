import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../api/client';
import './SizeStockModal.css';

const SizeStockModal = ({ show, onClose, product, onSizesUpdated }) => {
  const [sizes, setSizes] = useState([]);
  const [newSize, setNewSize] = useState('');
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    if (product && product.sizes) {
      setSizes(product.sizes);
    } else {
      setSizes([]);
    }
  }, [product]);

  if (!show || !product) {
    return null;
  }

  const handleAddSize = async () => {
    if (!newSize.trim() || !newStock.trim()) {
      Swal.fire('Error', 'El talle y el stock no pueden estar vacíos.', 'error');
      return;
    }

    const stock = parseInt(newStock, 10);
    if (isNaN(stock) || stock < 0) {
      Swal.fire('Error', 'El stock debe ser un número positivo.', 'error');
      return;
    }

    // Verificar si el talle ya existe
    if (sizes.some(s => s.size === newSize.trim())) {
        Swal.fire('Error', 'Este talle ya existe para el producto.', 'error');
        return;
    }

    const newSizeData = { size: newSize.trim(), stock };
    const updatedSizes = [...sizes, newSizeData];
    
    try {
      // La API espera un objeto con una clave 'sizes' que es un array
      await api.put(`/products/${product.id}/sizes`, { sizes: updatedSizes });
      setSizes(updatedSizes);
      setNewSize('');
      setNewStock('');
      Swal.fire('Éxito', 'Talle añadido correctamente.', 'success');
      if(onSizesUpdated) onSizesUpdated(); // Actualizar la lista de productos
    } catch (error) {
      console.error('Error al añadir talle:', error);
      Swal.fire('Error', 'No se pudo añadir el talle.', 'error');
    }
  };

  const handleRemoveSize = async (sizeToRemove) => {
    const updatedSizes = sizes.filter(s => s.size !== sizeToRemove);
    
    try {
      // La API espera un objeto con una clave 'sizes' que es un array
      await api.put(`/products/${product.id}/sizes`, { sizes: updatedSizes });
      setSizes(updatedSizes);
      Swal.fire('Éxito', 'Talle eliminado correctamente.', 'success');
      if(onSizesUpdated) onSizesUpdated(); // Actualizar la lista de productos
    } catch (error) {
      console.error('Error al eliminar talle:', error);
      Swal.fire('Error', 'No se pudo eliminar el talle.', 'error');
    }
  };

  const handleStockChange = (size, newStock) => {
    const stock = parseInt(newStock, 10);
    if (isNaN(stock) || stock < 0) return; // Ignorar si no es un número válido

    const updatedSizes = sizes.map(s => 
        s.size === size ? { ...s, stock } : s
    );
    setSizes(updatedSizes);
  };

  const handleUpdateAllStocks = async () => {
    try {
        await api.put(`/products/${product.id}/sizes`, { sizes });
        Swal.fire('Éxito', 'Stock actualizado correctamente.', 'success');
        if(onSizesUpdated) onSizesUpdated();
        onClose(); // Cerrar el modal después de guardar
    } catch (error) {
        console.error('Error al actualizar el stock:', error);
        Swal.fire('Error', 'No se pudo actualizar el stock.', 'error');
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Gestionar Talles y Stock para {product.name}</h2>
        
        <div className="sizes-list">
          {sizes.length > 0 ? (
            sizes.map((s, index) => (
              <div key={index} className="size-item">
                <span>Talle: {s.size}</span>
                <input 
                    type="number"
                    value={s.stock}
                    onChange={(e) => handleStockChange(s.size, e.target.value)}
                    className="stock-input"
                />
                <button onClick={() => handleRemoveSize(s.size)} className="btn-delete-size">🗑️</button>
              </div>
            ))
          ) : (
            <p>No hay talles definidos para este producto.</p>
          )}
        </div>

        <div className="add-size-form">
          <h3 style={{width: '100%'}}>Añadir Nuevo Talle</h3>
          <input 
            type="text"
            placeholder="Talle (ej. M, 42)"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
          />
          <input 
            type="number"
            placeholder="Stock inicial"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
          />
          <button onClick={handleAddSize} className="boton-secundario">Añadir</button>
        </div>

        <div className="modal-actions">
            <button onClick={handleUpdateAllStocks} className="boton-verde">Guardar Cambios</button>
            <button onClick={onClose} className="boton-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default SizeStockModal;
