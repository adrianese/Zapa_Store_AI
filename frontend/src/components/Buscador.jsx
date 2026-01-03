import React, { useEffect, useState, useCallback } from 'react';
import './Buscador.css'; 

const Buscador = ({ listings: productos, onFiltrar }) => {
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState('');

  const [marcas, setMarcas] = useState([]);
  const [actividades, setActividades] = useState([]);

  // Cargar opciones únicas de marca y actividad
  useEffect(() => {
    if (!productos || productos.length === 0) return;
    
    // Normalizar marcas para evitar duplicados por mayúsculas/minúsculas/espacios
    const normalizar = (str) => str ? str.trim().toLowerCase().replace(/\s+/g, '') : '';
    const marcasMap = {};
    productos.forEach((p) => {
      const raw = p.product?.brand;
      if (raw && typeof raw === 'string' && raw.trim() !== '') {
        const norm = normalizar(raw);
        if (!marcasMap[norm]) {
          marcasMap[norm] = raw.trim();
        }
      }
    });
    const marcasUnicas = Object.values(marcasMap);
    const actividadesUnicas = [...new Set(
      productos
        .map((p) => p.product?.attributes?.activity)
        .filter((a) => a && typeof a === 'string' && a.trim() !== '')
        .map((a) => a.trim())
    )];
    setMarcas(marcasUnicas);
    setActividades(actividadesUnicas);
  }, [productos]);

  // Aplicar filtros usando useCallback para evitar recrear la función
  const aplicarFiltros = useCallback(() => {
    if (!productos || productos.length === 0) {
      onFiltrar([]);
      return;
    }



    let filtrados = productos.filter(
      (p) => {
        const normalizar = (str) => str ? str.trim().toLowerCase().replace(/\s+/g, '') : '';
        const prodBrand = normalizar(p.product?.brand);
        const selBrand = normalizar(marcaSeleccionada);
        const prodAct = normalizar(p.product?.attributes?.activity);
        const selAct = normalizar(actividadSeleccionada);
        return (
          (selBrand === '' || prodBrand === selBrand) &&
          (selAct === '' || prodAct === selAct)
        );
      }
    );

    if (ordenPrecio === 'asc') {
      filtrados.sort((a, b) => a.price_minor - b.price_minor);
    } else if (ordenPrecio === 'desc') {
      filtrados.sort((a, b) => b.price_minor - a.price_minor);
    }

    onFiltrar(filtrados);
  }, [marcaSeleccionada, actividadSeleccionada, ordenPrecio, productos, onFiltrar]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  return (
    <section className="formulario buscador">
      <h2>Encontrá los Mejores Precios en Zapatillas</h2>
      <h3>¿Qué Estás Buscando?</h3>

      <div className="input-buscador">
        <button
          className="boton-verde boton-redondeado"
          onClick={() => {
            setMarcaSeleccionada('');
            setActividadSeleccionada('');
            setOrdenPrecio('');
          }}
        >
          Todos los productos
        </button>

        <label>
          Marca:
          <select
            value={marcaSeleccionada}
            onChange={(e) => setMarcaSeleccionada(e.target.value)}
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
        </label>

        <label>
          Actividad:
          <select
            value={actividadSeleccionada}
            onChange={(e) => setActividadSeleccionada(e.target.value)}
          >
            <option value="">Todas las actividades</option>
            {actividades.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </label>

        <label>
          Precio:
          <select
            value={ordenPrecio}
            onChange={(e) => setOrdenPrecio(e.target.value)}
          >
            <option value="">Sin orden</option>
            <option value="asc">Menor a mayor</option>
            <option value="desc">Mayor a menor</option>
          </select>
        </label>
      </div>
    </section>
  );
};

export default Buscador;
