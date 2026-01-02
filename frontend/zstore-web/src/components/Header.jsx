import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { FaShoppingCart, FaUser, FaSignOutAlt } from "react-icons/fa";
import { CarritoContext } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import "./Header.css";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { carrito } = useContext(CarritoContext);
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  const truncateAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <header className="header">
      <div className="contenedor contenido-header">
        <div className="barra">
          <NavLink to="/" className="link-h1">
            <h1 className="titulo-header">
              ZAPA <span className="estilo-titulo">Store</span>
            </h1>
          </NavLink>
          <nav className="navegacion">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "activo" : "")}
              end
            >
              Inicio
            </NavLink>
            <NavLink
              to="/subasta"
              className={({ isActive }) => (isActive ? "activo" : "")}
            >
              Subasta
            </NavLink>
            <NavLink
              to="/carrito"
              className={({ isActive }) => `carrito-link ${isActive ? "activo" : ""}`}
            >
              <span className="carrito-texto">Carrito</span>
              <FaShoppingCart />
              {totalItems > 0 && (
                <span className="carrito-badge">{totalItems}</span>
              )}
            </NavLink>
            
            {isAuthenticated ? (
              <div className="user-menu-container">
                <button 
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <FaUser />
                  <span className="user-name">{user?.name?.split(' ')[0]}</span>
                </button>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <span className="user-email">{user?.email}</span>
                    </div>
                    <NavLink to="/mis-ordenes" onClick={() => setShowUserMenu(false)}>
                      Mis Órdenes
                    </NavLink>
                    <NavLink to="/perfil" onClick={() => setShowUserMenu(false)}>
                      Mi Perfil
                    </NavLink>
                    <button onClick={handleLogout} className="logout-btn">
                      <FaSignOutAlt /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => `login-link ${isActive ? "activo" : ""}`}
              >
                <FaUser />
                <span>Ingresar</span>
              </NavLink>
            )}
            
            <div className="wallet-container">
              {isConnected ? (
                <button className="wallet-btn connected" onClick={disconnectWallet}>
                  {truncateAddress(address)}
                </button>
              ) : (
                <button className="wallet-btn" onClick={connectWallet}>
                  Connect Wallet
                </button>
              )}
            </div>

            <button 
              className="btn-dark-mode" 
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
