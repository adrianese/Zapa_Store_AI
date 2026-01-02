import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import ProductosAdmin from "./admin/ProductosAdmin";
import DetallesEditor from "./admin/DetallesEditor";
import SubastaAdmin from "./admin/SubastaAdmin";
import PedidosAdmin from "./admin/PedidosAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import ConfiguracionAdmin from "./admin/ConfiguracionAdmin";
import "./Admin.css";

const Admin = () => {
  const [currentSection, setCurrentSection] = useState(null);
  const navigate = useNavigate();
  const { user, isAdmin, loading, logout } = useAuth();

  // Si no es admin, redirigir al inicio
  if (!loading && !isAdmin) {
    Swal.fire({
      title: "Acceso denegado",
      text: "No tienes permisos de administrador.",
      icon: "error",
    });
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#71b100",
      cancelButtonColor: "#999",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        navigate("/");
        Swal.fire("Sesión cerrada", "", "success");
      }
    });
  };

  const renderSection = () => {
    switch (currentSection) {
      case "productos":
        return <ProductosAdmin onBack={() => setCurrentSection(null)} />;
      case "detalles":
        return <DetallesEditor onBack={() => setCurrentSection(null)} />;
      case "subasta":
        return <SubastaAdmin onBack={() => setCurrentSection(null)} />;
      case "pedidos":
        return <PedidosAdmin onBack={() => setCurrentSection(null)} />;
      case "estadisticas":
        return <EstadisticasAdmin onBack={() => setCurrentSection(null)} />;
      case "configuracion":
        return <ConfiguracionAdmin onBack={() => setCurrentSection(null)} />;
      default:
        return null;
    }
  };

  // Mostrar loading mientras se verifica auth
  if (loading) {
    return (
      <div className="admin-page">
        <div className="contenedor">
          <div className="admin-loading">
            <h2>Cargando...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (currentSection) {
    return (
      <div className="admin-page">
        <div className="contenedor">{renderSection()}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="contenedor">
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1 className="admin-titulo">Panel de Administración</h1>
            <button className="boton-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>

          <div className="admin-welcome">
            <h2>Bienvenido, {user?.name || "Administrador"}</h2>
            <p>Selecciona una sección para gestionar el sistema.</p>
          </div>

          <div className="admin-sections">
            <div className="admin-card">
              <h3>📦 Gestión de Productos</h3>
              <p>Administra el catálogo de productos de la tienda.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("productos")}>
                Ver Productos
              </button>
            </div>

            <div className="admin-card">
              <h3>📋 Pedidos</h3>
              <p>Revisa y gestiona los pedidos de los clientes.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("pedidos")}>Ver Pedidos</button>
            </div>

            <div className="admin-card">
              <h3>📊 Estadísticas</h3>
              <p>Visualiza reportes de ventas y métricas del negocio.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("estadisticas")}>Ver Estadísticas</button>
            </div>

            <div className="admin-card">
              <h3>🔧 Configuración</h3>
              <p>Ajusta los parámetros generales del sistema.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("configuracion")}>Configurar</button>
            </div>

            <div className="admin-card">
              <h3>🎨 Detalles de Marca</h3>
              <p>Edita el archivo detalles.json con información de marcas.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("detalles")}>
                Editar Detalles
              </button>
            </div>

            <div className="admin-card">
              <h3>🔨 Gestión de Subasta</h3>
              <p>Carga productos para subastar con control de detalles y talles.</p>
              <button className="boton-verde" onClick={() => setCurrentSection("subasta")}>
                Gestionar Subastas
              </button>
            </div>
          </div>

          <div className="admin-info">
            <h3>Estado del Sistema</h3>
            <div className="system-status">
              <div className="status-item">
                <span className="status-label">Base de Datos:</span>
                <span className="status-value status-ok">✓ Conectada</span>
              </div>
              <div className="status-item">
                <span className="status-label">API Backend:</span>
                <span className="status-value status-ok">✓ Operativa</span>
              </div>
              <div className="status-item">
                <span className="status-label">Productos en catálogo:</span>
                <span className="status-value">30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
