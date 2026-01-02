import React, { useState } from "react";
import Swal from "sweetalert2";
import "./AdminCommon.css";

const ConfiguracionAdmin = ({ onBack }) => {
  const [config, setConfig] = useState({
    storeName: "ZStore",
    storeEmail: "contacto@zstore.com",
    storePhone: "+54 11 1234-5678",
    currency: "ARS",
    taxRate: 21,
    shippingEnabled: true,
    freeShippingThreshold: 50000,
    maintenanceMode: false,
    allowRegistrations: true,
    enableAuctions: true,
    enableBlockchain: false,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular guardado (en producción sería una llamada API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar en localStorage como demo
      localStorage.setItem("zstore_config", JSON.stringify(config));
      
      Swal.fire({
        icon: "success",
        title: "Configuración guardada",
        text: "Los cambios se aplicarán inmediatamente.",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Error", "No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      title: "¿Restaurar valores predeterminados?",
      text: "Esto revertirá todas las configuraciones",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e08709",
      cancelButtonColor: "#71b100",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        setConfig({
          storeName: "ZStore",
          storeEmail: "contacto@zstore.com",
          storePhone: "+54 11 1234-5678",
          currency: "ARS",
          taxRate: 21,
          shippingEnabled: true,
          freeShippingThreshold: 50000,
          maintenanceMode: false,
          allowRegistrations: true,
          enableAuctions: true,
          enableBlockchain: false,
        });
        Swal.fire("Restaurado", "Configuración restablecida", "success");
      }
    });
  };

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>🔧 Configuración del Sistema</h2>
      <p className="admin-subtitle">Ajusta los parámetros generales de la tienda</p>

      <div className="config-sections">
        {/* Información de la tienda */}
        <div className="config-card">
          <h3>🏪 Información de la Tienda</h3>
          <div className="form-group">
            <label htmlFor="storeName">Nombre de la tienda</label>
            <input
              type="text"
              id="storeName"
              value={config.storeName}
              onChange={(e) => handleChange("storeName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="storeEmail">Email de contacto</label>
            <input
              type="email"
              id="storeEmail"
              value={config.storeEmail}
              onChange={(e) => handleChange("storeEmail", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="storePhone">Teléfono</label>
            <input
              type="text"
              id="storePhone"
              value={config.storePhone}
              onChange={(e) => handleChange("storePhone", e.target.value)}
            />
          </div>
        </div>

        {/* Configuración de precios */}
        <div className="config-card">
          <h3>💰 Precios e Impuestos</h3>
          <div className="form-group">
            <label htmlFor="currency">Moneda</label>
            <select
              id="currency"
              value={config.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taxRate">Tasa de IVA (%)</label>
            <input
              type="number"
              id="taxRate"
              min="0"
              max="100"
              value={config.taxRate}
              onChange={(e) => handleChange("taxRate", parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Configuración de envíos */}
        <div className="config-card">
          <h3>🚚 Envíos</h3>
          <div className="form-group toggle-group">
            <label>
              <input
                type="checkbox"
                checked={config.shippingEnabled}
                onChange={(e) => handleChange("shippingEnabled", e.target.checked)}
              />
              <span className="toggle-label">Habilitar envíos</span>
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="freeShippingThreshold">Envío gratis desde ($)</label>
            <input
              type="number"
              id="freeShippingThreshold"
              min="0"
              value={config.freeShippingThreshold}
              onChange={(e) => handleChange("freeShippingThreshold", parseInt(e.target.value))}
            />
            <small>0 = Sin envío gratis</small>
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="config-card">
          <h3>⚡ Funcionalidades</h3>
          <div className="form-group toggle-group">
            <label>
              <input
                type="checkbox"
                checked={config.allowRegistrations}
                onChange={(e) => handleChange("allowRegistrations", e.target.checked)}
              />
              <span className="toggle-label">Permitir registros de usuarios</span>
            </label>
          </div>
          <div className="form-group toggle-group">
            <label>
              <input
                type="checkbox"
                checked={config.enableAuctions}
                onChange={(e) => handleChange("enableAuctions", e.target.checked)}
              />
              <span className="toggle-label">Habilitar sistema de subastas</span>
            </label>
          </div>
          <div className="form-group toggle-group">
            <label>
              <input
                type="checkbox"
                checked={config.enableBlockchain}
                onChange={(e) => handleChange("enableBlockchain", e.target.checked)}
              />
              <span className="toggle-label">Habilitar pagos con blockchain</span>
            </label>
            <small className="feature-note">🔒 Requiere configuración de contratos inteligentes</small>
          </div>
        </div>

        {/* Modo mantenimiento */}
        <div className="config-card config-warning">
          <h3>⚠️ Modo Mantenimiento</h3>
          <div className="form-group toggle-group">
            <label>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
              />
              <span className="toggle-label">Activar modo mantenimiento</span>
            </label>
            <small className="warning-note">
              ⚠️ La tienda no estará disponible para los clientes
            </small>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="config-actions">
        <button 
          className="boton-verde" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando..." : "💾 Guardar Configuración"}
        </button>
        <button 
          className="boton-secundario" 
          onClick={handleReset}
        >
          🔄 Restaurar Valores
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionAdmin;
