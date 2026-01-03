# Test Archive

Carpeta para mantener historial de versiones de tests.

## Estructura
```
test/
├── archive/
│   └── YYYY-MM-DD/
│       └── NombreTest.version.js
├── Auction.test.js      (actual)
└── Marketplace.test.js  (actual)
```

## Historial

### 2026-01-02
- `Auction.test.v1-minbid-antispam.js` - 85 tests
  - Tests completos con sistema anti micro-pujas
  - Incrementos mínimos absolutos y porcentuales
  - Configuración por subasta
  - Withdraw pattern
  - Penalización 1% outbid
  - Anti-sniping
  - Sistema de depósitos

## Convención de nombres
- `{Contrato}.test.v{version}-{feature}.js`
- Ejemplo: `Auction.test.v2-newfeature.js`
