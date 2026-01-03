import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { CarritoContext } from '../context/CarritoContext';
import VideoBanner from '../components/VideoBanner';
import Buscador from '../components/Buscador';
import ProductGrid from '../components/ProductGrid';
import CarritoModal from '../components/CarritoModal';
import Swal from 'sweetalert2';
import api from '../api/client';
import './Inicio.css';

const Inicio = () => {
  const [listings, setListings] = useState([]);
  const [listingsFiltrados, setListingsFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarBotonFlotante, setMostrarBotonFlotante] = useState(false);
  const [mostrarScrollTop, setMostrarScrollTop] = useState(false);
  const { carrito, setCarrito } = useContext(CarritoContext);
  const navigate = useNavigate();

  // Detectar scroll para mostrar botón flotante
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
      
      // Mostrar después del 50% del scroll
      setMostrarBotonFlotante(scrollPercentage > 50);
      
      // Mostrar botón de scroll to top después de 900px (más avanzado)
      setMostrarScrollTop(scrollTop > 900);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/listings'); // Fetch listings now
      const data = response.data.data || response.data; // Assumes pagination may wrap in 'data'
      setListings(data);
      setListingsFiltrados(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Error al cargar los listados. Por favor, intenta nuevamente.');
      const mockData = [];
      setListings(mockData);
      setListingsFiltrados(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = useCallback((listingsFiltrados) => {
    setListingsFiltrados(listingsFiltrados);
  }, []);

  const eliminarDelCarrito = (id, talle) => {
    setCarrito(
      carrito.filter((p) => !(p.id === id && p.talle === talle))
    );
  };

  const vaciarCarrito = () => {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: "Se eliminarán todos los productos",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e08709',
      cancelButtonColor: '#71b100',
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setCarrito([]);
      }
    });
  };

  const confirmarCompra = () => {
    setMostrarCarrito(false);
    navigate('/carrito');
  };

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="inicio-page">
      <VideoBanner />
      
      <section className="seccion-intro">
        <div className="contenedor">
          <h2>Bienvenido a ZStore</h2>
          <p>Tu tienda de zapatillas con tecnología blockchain</p>
        </div>
      </section>

      <Buscador listings={listings} onFiltrar={handleFiltrar} />
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <main className="main-content">
        {loading && <p className="loading-message">Cargando productos...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && (
          <ProductGrid listings={listingsFiltrados} />
        )}
      </main>

      {/* Botón flotante del carrito */}
      {mostrarBotonFlotante && totalItems > 0 && (
        <button
          className="boton-ver-carrito-flotante"
          onClick={() => setMostrarCarrito(true)}
          title="Ver carrito"
        >
          <FaShoppingCart size={30} />
          <span style={{ marginLeft: '1rem' }}>Ver Carrito ({totalItems})</span>
        </button>
      )}

      {/* Botón flotante scroll to top */}
      <button
        className={`boton-scroll-top ${mostrarScrollTop ? 'visible' : ''}`}
        onClick={() => {
          const buscador = document.querySelector('.buscador');
          if (buscador) {
            buscador.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        title="Ir al buscador"
      >
        <img src="/imagenes/uparrow.svg" alt="Ir arriba" />
      </button>

      {/* Modal del carrito */}
      {mostrarCarrito && (
        <CarritoModal
          carrito={carrito}
          setCarrito={setCarrito}
          onEliminar={eliminarDelCarrito}
          onVaciar={vaciarCarrito}
          onCerrar={() => setMostrarCarrito(false)}
          onConfirmar={confirmarCompra}
        />
      )}
    </div>
  );
};

export default Inicio;
