import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/client";
import "./AdminCommon.css";

const ConfiguracionAdmin = ({ onBack }) => {
  const [config, setConfig] = useState({
    // General
    store_name: "ZStore",
    store_email: "contacto@zstore.com",
    store_phone: "+54 11 1234-5678",
    currency: "ARS",
    tax_rate: 21,
    // Shipping
    shipping_enabled: true,
    free_shipping_threshold: 50000,
    default_shipping_cost: 2500,
    // Features
    maintenance_mode: false,
    allow_registrations: true,
    enable_auctions: true,
    enable_blockchain: true,
    // Blockchain
    blockchain_network: "polygon",
    marketplace_contract: "",
    platform_fee_percent: 5,
    blockchain_discount_percent: 5,
    // Payment
    transfer_discount_percent: 10,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings");
      
      if (response.data.success && response.data.data) {
        // Aplanar la estructura agrupada
        const flatSettings = {};
        Object.values(response.data.data).forEach(group => {
          Object.entries(group).forEach(([key, data]) => {
            flatSettings[key] = data.value;
          });
        });
        setConfig(prev => ({ ...prev, ...flatSettings }));
      }
    } catch (err) {
      console.error("Error al cargar configuraciones:", err);
      // Si falla, usar valores del localStorage como fallback
      const saved = localStorage.getItem("zstore_config");
      if (saved) {
        try {
          setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preparar settings para enviar
      const settingsToSave = [
        // General
        { key: "store_name", value: config.store_name, type: "string", group: "general" },
        { key: "store_email", value: config.store_email, type: "string", group: "general" },
        { key: "store_phone", value: config.store_phone, type: "string", group: "general" },
        { key: "currency", value: config.currency, type: "string", group: "general" },
        { key: "tax_rate", value: config.tax_rate, type: "integer", group: "general" },
        // Shipping
        { key: "shipping_enabled", value: config.shipping_enabled, type: "boolean", group: "shipping" },
        { key: "free_shipping_threshold", value: config.free_shipping_threshold, type: "integer", group: "shipping" },
        { key: "default_shipping_cost", value: config.default_shipping_cost, type: "integer", group: "shipping" },
        // Features
        { key: "maintenance_mode", value: config.maintenance_mode, type: "boolean", group: "features" },
        { key: "allow_registrations", value: config.allow_registrations, type: "boolean", group: "features" },
        { key: "enable_auctions", value: config.enable_auctions, type: "boolean", group: "features" },
        { key: "enable_blockchain", value: config.enable_blockchain, type: "boolean", group: "features" },
        // Blockchain
        { key: "blockchain_network", value: config.blockchain_network, type: "string", group: "blockchain" },
        { key: "marketplace_contract", value: config.marketplace_contract, type: "string", group: "blockchain" },
        { key: "platform_fee_percent", value: config.platform_fee_percent, type: "integer", group: "blockchain" },
        { key: "blockchain_discount_percent", value: config.blockchain_discount_percent, type: "integer", group: "blockchain" },
        // Payment
        { key: "transfer_discount_percent", value: config.transfer_discount_percent, type: "integer", group: "payment" },
      ];

      await api.post("/settings", { settings: settingsToSave });
      
      // Guardar también en localStorage como backup
      localStorage.setItem("zstore_config", JSON.stringify(config));
      
      Swal.fire({
        icon: "success",
        title: "Configuración guardada",
        text: "Los cambios se aplicarán inmediatamente.",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error al guardar:", err);
      Swal.fire("Error", "No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      title: "¿Restaurar valores predeterminados?",
      text: "Esto revertirá todas las configuraciones a sus valores por defecto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e08709",
      cancelButtonColor: "#71b100",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.post("/settings/reset");
          await fetchSettings();
          localStorage.removeItem("zstore_config");
          Swal.fire("Restaurado", "Configuración restablecida a valores por defecto", "success");
        } catch (err) {
          console.error("Error al restaurar:", err);
          Swal.fire("Error", "No se pudo restaurar la configuración.", "error");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="admin-section">
        <button className="boton-atras" onClick={onBack}>← Volver</button>
        <p className="loading-text">🔄 Cargando configuración...</p>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "🏪 General", icon: "🏪" },
    { id: "shipping", label: "🚚 Envíos", icon: "🚚" },
    { id: "features", label: "⚡ Funciones", icon: "⚡" },
    { id: "blockchain", label: "⛓️ Blockchain", icon: "⛓️" },
    { id: "payment", label: "💳 Pagos", icon: "💳" },
  ];

  return (
    <div className="admin-section">
      <button className="boton-atras" onClick={onBack}>← Volver al Panel</button>
      <h2>🔧 Configuración del Sistema</h2>
      <p className="admin-subtitle">Ajusta los parámetros generales de la tienda</p>

      {/* Tabs de navegación */}
      <div className="config-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`config-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="config-content">
        {/* Tab General */}
        {activeTab === "general" && (
          <div className="config-panel">
            <div className="config-card">
              <h3>🏪 Información de la Tienda</h3>
              <div className="form-group">
                <label htmlFor="store_name">Nombre de la tienda</label>
                <input
                  type="text"
                  id="store_name"
                  value={config.store_name}
                  onChange={(e) => handleChange("store_name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="store_email">Email de contacto</label>
                <input
                  type="email"
                  id="store_email"
                  value={config.store_email}
                  onChange={(e) => handleChange("store_email", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="store_phone">Teléfono</label>
                <input
                  type="text"
                  id="store_phone"
                  value={config.store_phone}
                  onChange={(e) => handleChange("store_phone", e.target.value)}
                />
              </div>
            </div>

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
                <label htmlFor="tax_rate">Tasa de IVA (%)</label>
                <input
                  type="number"
                  id="tax_rate"
                  min="0"
                  max="100"
                  value={config.tax_rate}
                  onChange={(e) => handleChange("tax_rate", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Envíos */}
        {activeTab === "shipping" && (
          <div className="config-panel">
            <div className="config-card">
              <h3>🚚 Configuración de Envíos</h3>
              <div className="form-group toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.shipping_enabled}
                    onChange={(e) => handleChange("shipping_enabled", e.target.checked)}
                  />
                  <span className="toggle-label">Habilitar envíos</span>
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="free_shipping_threshold">Envío gratis desde (centavos)</label>
                <input
                  type="number"
                  id="free_shipping_threshold"
                  min="0"
                  value={config.free_shipping_threshold}
                  onChange={(e) => handleChange("free_shipping_threshold", parseInt(e.target.value) || 0)}
                />
                <small>Valor en centavos. 50000 = $500. Poner 0 para deshabilitar envío gratis.</small>
              </div>
              <div className="form-group">
                <label htmlFor="default_shipping_cost">Costo de envío base (centavos)</label>
                <input
                  type="number"
                  id="default_shipping_cost"
                  min="0"
                  value={config.default_shipping_cost}
                  onChange={(e) => handleChange("default_shipping_cost", parseInt(e.target.value) || 0)}
                />
                <small>Valor en centavos. 2500 = $25</small>
              </div>
            </div>
          </div>
        )}

        {/* Tab Funciones */}
        {activeTab === "features" && (
          <div className="config-panel">
            <div className="config-card">
              <h3>⚡ Funcionalidades del Sistema</h3>
              <div className="form-group toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.allow_registrations}
                    onChange={(e) => handleChange("allow_registrations", e.target.checked)}
                  />
                  <span className="toggle-label">Permitir registro de nuevos usuarios</span>
                </label>
              </div>
              <div className="form-group toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.enable_auctions}
                    onChange={(e) => handleChange("enable_auctions", e.target.checked)}
                  />
                  <span className="toggle-label">Habilitar sistema de subastas</span>
                </label>
              </div>
              <div className="form-group toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.enable_blockchain}
                    onChange={(e) => handleChange("enable_blockchain", e.target.checked)}
                  />
                  <span className="toggle-label">Habilitar pagos con blockchain</span>
                </label>
                <small className="feature-note">🔒 Requiere configuración de contratos inteligentes</small>
              </div>
            </div>

            <div className="config-card config-warning">
              <h3>⚠️ Modo Mantenimiento</h3>
              <div className="form-group toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.maintenance_mode}
                    onChange={(e) => handleChange("maintenance_mode", e.target.checked)}
                  />
                  <span className="toggle-label">Activar modo mantenimiento</span>
                </label>
                <small className="warning-note">
                  ⚠️ La tienda no estará disponible para los clientes
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Tab Blockchain */}
        {activeTab === "blockchain" && (
          <div className="config-panel">
            <div className="config-card">
              <h3>⛓️ Configuración Blockchain</h3>
              <div className="form-group">
                <label htmlFor="blockchain_network">Red Blockchain</label>
                <select
                  id="blockchain_network"
                  value={config.blockchain_network}
                  onChange={(e) => handleChange("blockchain_network", e.target.value)}
                >
                  <option value="ethereum">Ethereum Mainnet</option>
                  <option value="polygon">Polygon (Matic)</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                  <option value="sepolia">Sepolia (Testnet)</option>
                  <option value="mumbai">Mumbai (Polygon Testnet)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="marketplace_contract">Dirección del Contrato Marketplace</label>
                <input
                  type="text"
                  id="marketplace_contract"
                  value={config.marketplace_contract}
                  onChange={(e) => handleChange("marketplace_contract", e.target.value)}
                  placeholder="0x..."
                />
                <small>Dirección del contrato inteligente desplegado</small>
              </div>
              <div className="form-group">
                <label htmlFor="platform_fee_percent">Comisión de Plataforma (%)</label>
                <input
                  type="number"
                  id="platform_fee_percent"
                  min="0"
                  max="100"
                  value={config.platform_fee_percent}
                  onChange={(e) => handleChange("platform_fee_percent", parseInt(e.target.value) || 0)}
                />
                <small>Porcentaje que cobra la plataforma por cada venta</small>
              </div>
              <div className="form-group">
                <label htmlFor="blockchain_discount_percent">Descuento por Pago Blockchain (%)</label>
                <input
                  type="number"
                  id="blockchain_discount_percent"
                  min="0"
                  max="50"
                  value={config.blockchain_discount_percent}
                  onChange={(e) => handleChange("blockchain_discount_percent", parseInt(e.target.value) || 0)}
                />
                <small>Incentivo para usuarios que paguen con criptomonedas</small>
              </div>
            </div>
          </div>
        )}

        {/* Tab Pagos */}
        {activeTab === "payment" && (
          <div className="config-panel">
            <div className="config-card">
              <h3>💳 Métodos de Pago</h3>
              <div className="form-group">
                <label htmlFor="transfer_discount_percent">Descuento por Transferencia (%)</label>
                <input
                  type="number"
                  id="transfer_discount_percent"
                  min="0"
                  max="50"
                  value={config.transfer_discount_percent}
                  onChange={(e) => handleChange("transfer_discount_percent", parseInt(e.target.value) || 0)}
                />
                <small>Descuento aplicado cuando el cliente paga por transferencia bancaria</small>
              </div>
              
              <div className="payment-methods-info">
                <h4>Métodos Disponibles</h4>
                <div className="payment-method-item">
                  <span className="payment-icon">💳</span>
                  <span className="payment-name">Tarjeta de Crédito/Débito</span>
                  <span className="payment-status active">Activo</span>
                </div>
                <div className="payment-method-item">
                  <span className="payment-icon">🏦</span>
                  <span className="payment-name">Transferencia Bancaria</span>
                  <span className="payment-status active">Activo (-{config.transfer_discount_percent}%)</span>
                </div>
                <div className="payment-method-item">
                  <span className="payment-icon">💵</span>
                  <span className="payment-name">Efectivo</span>
                  <span className="payment-status active">Activo</span>
                </div>
                <div className="payment-method-item">
                  <span className="payment-icon">⛓️</span>
                  <span className="payment-name">Blockchain (Crypto)</span>
                  <span className={`payment-status ${config.enable_blockchain ? "active" : "inactive"}`}>
                    {config.enable_blockchain ? `Activo (-${config.blockchain_discount_percent}%)` : "Desactivado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="config-actions">
        <button 
          className="boton-verde" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "⏳ Guardando..." : "💾 Guardar Configuración"}
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
