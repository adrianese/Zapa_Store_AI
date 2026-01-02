import React, { useState } from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.css';


const ProductGrid = ({ listings = [] }) => {
  // Permitir tanto array plano como paginado (con .data)
  const allListings = Array.isArray(listings) ? listings : (listings.data || []);
  console.log('ProductGrid listings:', allListings);
  if (!allListings || allListings.length === 0) {
    return (
      <div className="no-productos">
        <p>No se encontraron productos listados</p>
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(allListings.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calcular productos a mostrar en la página actual
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentListings = allListings.slice(startIdx, endIdx);

  return (
    <section className="product-grid-container">
      <div className="product-grid">
        {currentListings.map((listing) => (
          <ProductCard key={listing.id} listing={listing} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="paginacion">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? 'pagina-activa' : ''}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
