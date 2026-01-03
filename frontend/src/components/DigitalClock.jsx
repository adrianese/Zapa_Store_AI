import React, { useEffect, useState } from "react";

export default function DigitalClock({ className = "" }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formato: 02/01/2026 21:15:08
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <div className={`digital-clock ${className}`} style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '1.1rem',
      color: '#10b981',
      background: '#fff',
      borderRadius: '0.5rem',
      padding: '0.2rem 0.7rem',
      boxShadow: '0 1px 4px 0 rgba(16,185,129,0.08)',
      display: 'inline-block',
      minWidth: '170px',
      textAlign: 'center',
      letterSpacing: '0.04em',
    }}>
      <span>{date} {time}</span>
    </div>
  );
}
