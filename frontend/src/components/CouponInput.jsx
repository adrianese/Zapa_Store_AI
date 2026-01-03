import { useState } from 'react';
import api from '../api/client';
import './CouponInput.css';

const CouponInput = ({ subtotal, items, onCouponApply, onCouponRemove }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      setError('Ingresá un código de cupón');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/coupons/validate', {
        code: code.toUpperCase(),
        subtotal,
        items,
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.data);
        onCouponApply?.(response.data.data);
        setError('');
      } else {
        setError(response.data.message || 'Cupón inválido');
        setAppliedCoupon(null);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo validar el cupón';
      setError(message);
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCode('');
    setError('');
    onCouponRemove?.();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% de descuento`;
    }
    return `$${parseFloat(coupon.value).toLocaleString('es-AR')} de descuento`;
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-applied">
        <div className="coupon-applied-info">
          <span className="coupon-check">✓</span>
          <div className="coupon-details">
            <span className="coupon-code-applied">{appliedCoupon.code}</span>
            <span className="coupon-discount-info">{formatDiscount(appliedCoupon)}</span>
          </div>
          <span className="coupon-saving">
            -${appliedCoupon.discount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <button 
          type="button" 
          className="coupon-remove-btn" 
          onClick={handleRemoveCoupon}
          aria-label="Quitar cupón"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="coupon-input-container">
      <div className="coupon-input-wrapper">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Código de cupón"
          className={`coupon-input ${error ? 'coupon-input-error' : ''}`}
          disabled={loading}
          maxLength={50}
        />
        <button
          type="button"
          onClick={handleApplyCoupon}
          className="coupon-apply-btn"
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <span className="coupon-spinner"></span>
          ) : (
            'Aplicar'
          )}
        </button>
      </div>
      {error && <p className="coupon-error">{error}</p>}
    </div>
  );
};

export default CouponInput;
