import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Inicio from './pages/Inicio';
import Subasta from './pages/Subasta';
import ListingPage from './pages/ListingPage';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import SeguimientoEnvio from './pages/SeguimientoEnvio';
import Admin from './pages/Admin';
import MisOrdenes from './pages/MisOrdenes';
import PerfilUsuario from './pages/PerfilUsuario';
import CreateListingPage from './pages/CreateListingPage';
import './App.css';

function App() {
  return (
    <Router>
      <Web3Provider>
        <AuthProvider>
          <MainLayout>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Inicio />} />
              <Route path="/listing/:id" element={<ListingPage />} />
              <Route path="/subasta" element={<Subasta />} />
              <Route path="/subastas" element={<Subasta />} />
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/seguimiento-envio" element={<SeguimientoEnvio />} />
              
              {/* Rutas protegidas */}
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/crear-listado" element={
                <ProtectedRoute>
                  <CreateListingPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/mis-ordenes" element={
                <ProtectedRoute>
                  <MisOrdenes />
                </ProtectedRoute>
              } />
              <Route path="/perfil" element={
                <ProtectedRoute>
                  <PerfilUsuario />
                </ProtectedRoute>
              } />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </Web3Provider>
    </Router>
  );
}


export default App;
