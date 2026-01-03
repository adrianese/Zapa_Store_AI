import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password, formData.remember);
      const userRoles = response.roles || [];
      const isUserAdmin = userRoles.includes("admin");
      
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: isUserAdmin ? "Acceso de administrador concedido" : "Inicio de sesión exitoso",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Si es admin, redirigir al panel de admin
        if (isUserAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      });
    } catch (error) {
      const message = error.response?.data?.message || 
                      error.response?.data?.errors?.email?.[0] ||
                      "Error al iniciar sesión";
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Iniciar Sesión</h1>
          <p>Ingresá a tu cuenta de ZStore</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-row remember-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              <span>Recordarme</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="auth-link">
              Registrate
            </Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>o continuar con</span>
        </div>

        <div className="social-buttons">
          <button type="button" className="btn-social btn-google" disabled>
            <span>🔷</span> Google
          </button>
          <button type="button" className="btn-social btn-wallet" disabled>
            <span>🦊</span> Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
