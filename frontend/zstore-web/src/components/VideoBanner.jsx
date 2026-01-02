import React from 'react';
import './VideoBanner.css';

const VideoBanner = () => {
  return (
    <div className="video-container">
      <div className="video-overlay">
        <video autoPlay muted loop poster="/imagenes/banner.png">
          <source src="/video/zapastore.mp4" type="video/mp4" />
          Tu navegador no soporta el video HTML5.
        </video>
      </div>
      <div className="video-content">
        <h2 className="video-title">Bienvenido a ZStore</h2>
        <p className="video-subtitle">Las mejores zapatillas al mejor precio</p>
      </div>
    </div>
  );
};

export default VideoBanner;
