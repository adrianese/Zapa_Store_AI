import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../api/client";


export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      setRolesLoaded(true);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      // Asegurar que roles sea un array
      const userRoles = response.data.roles || [];
      setRoles(Array.isArray(userRoles) ? userRoles : [...userRoles]);
      setIsAuthenticated(true);
      setRolesLoaded(true);
    } catch (error) {
      // Token inválido o expirado
      localStorage.removeItem("auth_token");
      setUser(null);
      setRoles([]);
      setIsAuthenticated(false);
      setRolesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, remember = false) => {
    const response = await api.post("/auth/login", {
      email,
      password,
      remember,
    });

    const { user, token, roles: userRoles } = response.data;
    localStorage.setItem("auth_token", token);
    setUser(user);
    setRoles(userRoles || []);
    setIsAuthenticated(true);

    return response.data;
  };

  const register = async (name, email, password, passwordConfirmation, phone = null) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      phone,
    });

    const { user, token } = response.data;
    localStorage.setItem("auth_token", token);
    setUser(user);
    setIsAuthenticated(true);

    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignorar error si el token ya expiró
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setRoles([]);
      setIsAuthenticated(false);
    }
  };

  const hasRole = (role) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isSeller = hasRole("seller");
  const isBuyer = hasRole("buyer");

  const updateProfile = async (data) => {
    const response = await api.put("/auth/profile", data);
    setUser(response.data.user);
    return response.data;
  };

  const value = {
    user,
    roles,
    loading,
    rolesLoaded,
    isAuthenticated,
    isAdmin,
    isSeller,
    isBuyer,
    hasRole,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

export default AuthContext;
