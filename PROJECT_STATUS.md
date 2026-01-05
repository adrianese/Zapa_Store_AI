# 📊 ZSTORE-AI - Estado del Proyecto

> Última actualización: 4 de Enero, 2026

---

## 🎯 Visión General

Marketplace Web3 con subastas, escrow blockchain, identidad descentralizada (DID) y chatbot IA.

**Stack:**
- Frontend: React 19 + Vite 7 + ethers.js
- Backend: Laravel 12 + Sanctum + Spatie Permission
- Blockchain: Solidity 0.8.20 + OpenZeppelin + Hardhat
- Database: MySQL `zstore_ai`

---

## ✅ IMPLEMENTADO vs ⏳ PENDIENTE

| Módulo | Estado | Notas |
|--------|--------|-------|
| 🔐 Auth | ✅ 100% | Register, Login, Logout, Profile, Roles |
| 📦 Productos | ✅ 100% | CRUD, talles, stock, imágenes, **precios actualizados x100** |
| 🛒 Carrito | ✅ 100% | Context, persistencia localStorage, **z-index fix** |
| 💳 Checkout | ✅ 95% | 3 pasos, direcciones, blockchain, **cupones** |
| 📋 Órdenes | ✅ 95% | CRUD, estados, **tracking**, **shipping info** |
| 📊 Admin Dashboard | ✅ 95% | Métricas, estadísticas, pedidos mejorados, **reloj local**, **countdown 3min** |
| 🏷️ Brand Details | ✅ 100% | CRUD, editor admin, display en producto |
| ⚙️ Configuración | ✅ 100% | **Backend real con Settings table** |
| 👥 Usuarios Admin | ✅ 100% | **CRUD completo, roles, activar/desactivar** |
| 📧 Notificaciones Email | ✅ 95% | **OrderStatusChanged + NotificationController** |
| 🎟️ Cupones | ✅ 100% | **CRUD admin, validación, aplicación en checkout** |
| 🔨 Subastas | ✅ 100% | Backend + UI tiempo real, anti-sniping, anti micro-pujas, cards responsivas, ruta /subastas, highlight naranja, fixes navegación, **botones hora cierre**, **countdown 3min** |
| 💰 Pujas (Bids) | ✅ 100% | BidController, historial, withdraw pattern, 1% penalty, fixes timezone, CORS, integración frontend |
| 📜 Contratos Solidity | ✅ 95% | **Marketplace.sol + Auction.sol completos + 85 tests** |
| 🌐 Web3 Integration | ✅ 85% | **Hardhat configurado, scripts deploy, OpenZeppelin npm** |
| 📚 Documentación | ✅ 95% | **Diagramas Mermaid, flujos visuales HTML, archivos .md actualizados** |
| 🤖 Chatbot | ❌ 0% | No implementado |
| 🆔 DID/Identidad | ❌ 0% | No implementado |
| ⚖️ Votaciones/Disputas | ❌ 5% | Solo modelo, sin lógica |
| 🔧 CORS | ✅ 100% | **Configurado para localhost:5173 y 5174** |
| 🕐 Reloj Admin | ✅ 100% | **Reloj local en panel subastas admin** |

---

## 🔗 CONTRATOS SOLIDITY

### ✅ `Marketplace.sol` (Implementado)
```
├── createItem()        → Crear listado
├── purchaseItem()      → Comprar con escrow
├── confirmReception()  → Liberar fondos al vendedor
├── raiseDispute()      → Iniciar disputa
├── resolveDispute()    → Resolver (solo admin)
├── withdraw()          → Retirar fondos
└── updateFees()        → Configurar comisiones
```

### ✅ `Auction.sol` (COMPLETO - Última versión)
```
├── createAuction()     → Crear subasta con 8 params (incluye custom increments)
├── createAuctionSimple() → Versión simplificada (6 params, usa globals)
├── startAuction()      → Iniciar subasta diferida
├── placeBid()          → Realizar puja (withdraw pattern + 1% penalty)
├── increaseBid()       → Incrementar puja propia SIN penalización
├── endAuction()        → Finalizar y asignar ganador
├── claimPrize()        → Reclamar premio ganador
├── cancelAuction()     → Cancelar (solo seller/admin)
├── withdraw()          → Retirar fondos (withdraw pattern)
├── withdrawFeePool()   → Admin retira fees acumulados

⚙️ Config Admin:
├── updateAntiSnipingParams()     → Ventana y extensión anti-sniping
├── updateMinBidIncrement()       → % mínimo global
├── updateMinAbsoluteBidIncrement() → Monto absoluto mínimo (~$20)
├── updateOutbidPenalty()         → % penalización (default 1%)

📊 View Functions:
├── getMinBidAmount()   → Mínimo para pujar
├── getMinBidInfo()     → Info detallada (%, abs, valores usados)
├── getBidHistory()     → Historial de pujas
├── getTimeRemaining()  → Tiempo restante
└── isAuctionActive()   → Estado activo

⭐ Features:
  - Withdraw Pattern: Pull > Push (seguridad reentrancy)
  - Penalización 1%: Outbid = 99% refund, 1% → feePool
  - Anti Micro-Pujas: MAX(% increment, absolute increment)
  - Config por subasta: Override globals con custom values
  - Anti-sniping: 5 min window, 5 min extension
  - Incremento mínimo: 5% O ~$20 (el mayor)
  - Sistema de depósitos opcional
  - Precio de reserva
  - Historial completo de pujas on-chain
  - ReentrancyGuard + Ownable (OpenZeppelin)
  - 85 tests pasando ✅
```

### ❌ `Identity.sol` (Pendiente - DID)
```
├── registerIdentity()  → Registrar wallet
├── issueBadge()        → Emitir badge soulbound
├── revokeBadge()       → Revocar badge
├── getReputation()     → Consultar score
└── verifyCredential()  → Verificar credencial
```

---

## 🗂️ ESTRUCTURA DE CARPETAS

```
Zstore-ai/
├── backend/                    # Laravel 12 API
│   ├── app/
│   │   ├── Events/             # NUEVO: Broadcast events
│   │   │   ├── NewBidPlaced.php
│   │   │   └── AuctionTimeExtended.php
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── OrderController.php
│   │   │   ├── AuctionController.php
│   │   │   ├── BidController.php      # Mejorado con anti-sniping
│   │   │   ├── CheckoutController.php
│   │   │   ├── AdminController.php
│   │   │   └── BrandDetailController.php
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   └── routes/api.php
│
├── frontend/                   # React 19 + Vite
│   └── src/
│       ├── pages/
│       │   ├── admin/          # Panel administrador
│       │   ├── ListingPage.jsx # Detalle producto
│       │   ├── Checkout.jsx    # Proceso de compra
│       │   └── Subasta.jsx     # Vista subasta (MEJORADO: tiempo real)
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── CarritoContext.jsx
│       │   └── Web3Context.jsx
│       └── components/
│           └── CarritoModal.jsx # Corregido z-index para Swal
│
├── contracts/                  # Solidity + Hardhat
│   ├── src/                    # Contratos Solidity
│   │   ├── Marketplace.sol
│   │   └── Auction.sol         # Subasta completa con withdraw pattern
│   ├── hardhat.config.js       # Config Hardhat (sepolia, mainnet)
│   ├── package.json            # Dependencias (@openzeppelin/contracts)
│   ├── scripts/
│   │   └── deploy.js           # Script de deploy
│   ├── test/
│   │   ├── Marketplace.test.js
│   │   ├── Auction.test.js     # 70 tests
│   │   └── archive/            # Historial de tests
│   │       └── 2026-01-02/
│   │           └── Auction.test.v1-minbid-antispam.js
│   └── node_modules/@openzeppelin/  # OpenZeppelin via npm
│
├── docs/                       # Documentación visual
│   ├── AUCTION_FLOW.md         # Documentación Markdown
│   └── auction-flow-diagram.html # Diagramas Mermaid interactivos
│
└── PROJECT_STATUS.md           # Este archivo
```

---

## 📡 API ENDPOINTS

### Públicos
```
GET  /products              → Listar productos
GET  /products/{id}         → Detalle producto
GET  /auctions              → Listar subastas
GET  /auctions/active       → Subasta activa
GET  /brand-details         → Detalles de marcas
```

### Autenticados
```
POST /auth/register         → Registro
POST /auth/login            → Login
POST /auth/logout           → Logout
GET  /auth/me               → Perfil

GET  /checkout/addresses    → Mis direcciones
POST /checkout/addresses    → Crear dirección
POST /checkout/init         → Iniciar checkout
POST /checkout/confirm      → Confirmar orden

GET  /orders                → Mis órdenes
POST /auctions/{id}/bid     → Realizar puja
```

### Admin (rol: admin)
```
GET  /admin/metrics         → Dashboard métricas
GET  /admin/orders          → Todos los pedidos
PUT  /admin/orders/{id}/status → Cambiar estado
PUT  /admin/orders/{id}/tracking → Agregar tracking
POST /admin/orders/{id}/delivered → Marcar entregado

POST /products              → Crear producto
PUT  /products/{id}         → Editar producto
DELETE /products/{id}       → Eliminar producto

POST /auctions              → Crear subasta
PUT  /auctions/{id}         → Editar subasta
POST /auctions/{id}/pause   → Pausar
POST /auctions/{id}/resume  → Reanudar

GET  /bids                  → NUEVO: Listar bids de subasta
GET  /bids/min-amount       → NUEVO: Obtener mínimo para pujar
POST /bids                  → Realizar puja

GET  /users                 → Listar usuarios
GET  /users/{id}            → Detalle usuario
PUT  /users/{id}            → Actualizar usuario
POST /users/{id}/role       → Asignar rol

GET  /settings              → Listar configuración
POST /settings              → Actualizar múltiples
PUT  /settings/{key}        → Actualizar una

GET  /coupons               → Listar cupones
POST /coupons               → Crear cupón
PUT  /coupons/{id}          → Editar cupón
DELETE /coupons/{id}        → Eliminar cupón
POST /coupons/{id}/toggle   → Activar/Desactivar
POST /coupons/generate-bulk → Generar en lote
```

---

## ⏱️ ESTIMACIÓN DE TIEMPO

### ✅ Fase 1: Admin Completo (COMPLETADO)
- [x] Gestión de Usuarios UI → UsuariosAdmin.jsx
- [x] Configuración Backend → Settings model + controller
- [x] Tracking en pedidos → PedidosAdmin mejorado
- [x] Notificaciones Email → OrderStatusChanged + NotificationBell
- [x] Sistema de Cupones → CuponesAdmin + CouponInput

### ✅ Fase 2: Subastas Funcionales (COMPLETADO)
- [x] `Auction.sol` contrato → Anti-sniping, depósitos, historial
- [x] Tests del contrato → Marketplace.test.js + Auction.test.js
- [x] UI tiempo real (WebSocket) → Subasta.jsx mejorado
- [x] BidController mejorado → Anti-sniping backend, eventos broadcast
- [x] API endpoints → GET /bids, GET /bids/min-amount

### ✅ Fase 3: Web3 Completo (COMPLETADO)
- [x] Hardhat config + deploy scripts → hardhat.config.js + deploy.js
- [x] Package.json con scripts → compile, test, deploy:local/sepolia/mainnet
- [x] Documentación contratos → contracts/README.md

### Fase 4: Extras (Opcional)
- [ ] Chatbot básico → 8-12 horas
- [ ] DID/Badges (Identity.sol) → 12-16 horas
- [ ] Votaciones/Disputas completo → 8-10 horas

---

## 📈 ROADMAP

```
✅ FASE 1 COMPLETADA ─────────────────────────────────────
  ⚙️ ADMIN COMPLETO
  ├── ✅ Gestión usuarios UI (UsuariosAdmin.jsx)
  ├── ✅ Configuración backend real (Settings)
  ├── ✅ Detalles envío en pedidos (tracking)
  ├── ✅ Notificaciones email (OrderStatusChanged)
  └── ✅ Sistema de cupones (CuponesAdmin)

✅ FASE 2 COMPLETADA ─────────────────────────────────────
  🔨 SUBASTAS FUNCIONALES
  ├── ✅ Auction.sol con anti-sniping
  ├── ✅ Tests contratos (Hardhat)
  ├── ✅ UI Subasta.jsx tiempo real
  ├── ✅ BidController + broadcast events
  └── ✅ Historial de pujas

✅ FASE 3 COMPLETADA ─────────────────────────────────────
  🌐 WEB3 + CONTRATOS AVANZADOS
  ├── ✅ Hardhat configurado
  ├── ✅ Deploy scripts (local/testnet/mainnet)
  ├── ✅ Documentación contratos
  ├── ✅ Withdraw Pattern (seguridad reentrancy)
  ├── ✅ Penalización 1% outbid
  ├── ✅ Sistema anti micro-pujas (dual increment)
  ├── ✅ Config personalizada por subasta
  ├── ✅ 85 tests completos
  ├── ✅ OpenZeppelin via npm
  └── ✅ Diagramas visuales actualizados

⏳ PENDIENTE ─────────────────────────────────────────────
  🤖 EXTRAS OPCIONALES
  ├── [ ] Chatbot básico (8-12 hrs)
  ├── [ ] Identity.sol DID/Badges (12-16 hrs)
  ├── [ ] Sistema de disputas completo (8-10 hrs)
  └── [ ] Frontend conectar con contrato Auction nuevo

🔜 PRÓXIMOS PASOS SUGERIDOS ──────────────────────────────
  1. [ ] Actualizar frontend Subasta.jsx para usar nuevas funciones:
     - getMinBidInfo() para mostrar incremento requerido
     - pendingWithdrawals para mostrar saldo a retirar
     - withdraw() botón para retirar fondos
  2. [ ] Conectar BidController con contrato Solidity (ethers.js)
  3. [ ] Deploy a Sepolia testnet para pruebas reales
  4. [ ] UI para admin: configurar incrementos globales

═══════════════════════════════════════════════════════════
              🎯 MVP LISTO PARA DEMO
═══════════════════════════════════════════════════════════
```

---

## 🗄️ BASE DE DATOS

### Tablas Principales
```sql
users               -- Usuarios con roles (Spatie) + is_active, wallet_address
products            -- Catálogo de productos
product_sizes       -- Talles y stock por producto
orders              -- Pedidos + tracking_number, tracking_carrier, shipped_at, delivered_at
order_items         -- Items de cada orden
shipping_addresses  -- Direcciones de envío guardadas
auctions            -- Subastas
auction_product     -- Productos en subasta (pivot)
bids                -- Pujas realizadas
brand_details       -- Detalles/descripción por marca
settings            -- Configuración del sistema (key-value con grupos)
notifications       -- Notificaciones de usuario (Laravel Notifications)
coupons             -- Cupones de descuento
coupon_user         -- Historial de uso de cupones
```

---

## 🐛 BUGS CONOCIDOS

- [ ] (Agregar bugs que surjan durante testing)

---

## 📝 NOTAS DE DESARROLLO

- **Puerto Backend:** 8000 (`php artisan serve`)
- **Puerto Frontend:** 5173 (`npm run dev`)
- **Sin Docker** - Desarrollo local
- **Dark Mode:** Usa `data-theme="dark"` en `:root`
- **Responsive:** Breakpoint principal en 900px

---

## 🔧 COMANDOS ÚTILES

```bash
# Backend
cd backend/zstore-api
php artisan serve
php artisan migrate
php artisan db:seed

# Frontend  
cd frontend/src
npm install
npm run dev

# Contratos (Hardhat)
cd contracts
npm install
npx hardhat compile       # Compilar contratos
npx hardhat test          # Ejecutar 85 tests
npx hardhat node          # Iniciar nodo local
npx hardhat run scripts/deploy.js --network localhost  # Deploy local
npx hardhat run scripts/deploy.js --network sepolia    # Deploy testnet
```

---

## 📋 CAMBIOS RECIENTES (2 Enero 2026)

### Contratos Solidity - Auction.sol
- ✅ **Withdraw Pattern** implementado (Pull > Push para seguridad)
- ✅ **Penalización 1%** para postores superados (99% refund, 1% → feePool)
- ✅ **increaseBid()** permite al mejor postor incrementar SIN penalización
- ✅ **Anti Micro-Pujas**: Sistema dual de incrementos mínimos
  - `minBidIncrementPercent`: 5% (configurable)
  - `minAbsoluteBidIncrement`: 0.005 ETH ~$20 (configurable)
  - Lógica: `increment = MAX(%, absoluto)`
- ✅ **Config por subasta**: Custom increments por subasta individual
- ✅ **withdrawFeePool()**: Admin puede retirar fees acumulados
- ✅ **getMinBidInfo()**: View function para frontend
- ✅ **OpenZeppelin via npm** (antes estaba en lib/)
- ✅ **Contratos movidos a src/** para evitar conflictos con node_modules
- ✅ **85 tests pasando** (70 Auction + 15 Marketplace)

### Tests
- ✅ Tests completos para anti micro-pujas
- ✅ Tests para withdraw pattern
- ✅ Tests para penalización 1%
- ✅ Tests para increaseBid sin penalización
- ✅ Tests para config custom por subasta
- ✅ **Carpeta archive/** para historial de tests

### Documentación
- ✅ **auction-flow-diagram.html** actualizado con:
  - Diagrama sistema anti micro-pujas
  - Diagrama config personalizada por subasta
  - Cards de configuración actualizadas
  - Ejemplos de cálculo de incrementos

---

### Cambios Recientes (4 de Enero, 2026)

#### 🔧 Reparación y Configuración
- ✅ **Proyecto restaurado** después de daño en archivos
- ✅ **CORS configurado** para localhost:5173 y 5174
- ✅ **Listings creados** - 30 productos activos en marketplace
- ✅ **Precios actualizados** - multiplicados x100 para aumentar valores

#### 🎨 Mejoras UI/UX Admin
- ✅ **Reloj local** agregado en panel de subastas admin
- ✅ **Countdown subastas** cambiado a 3 minutos (antes 5)
- ✅ **Botones hora cierre** - 23:59 y 23:00 para facilitar creación de subastas
- ✅ **Verificación exhaustiva** de todas las tabs del admin

#### 📦 Productos y Listings
- ✅ **Seeder ejecutado** - productos y listings creados correctamente
- ✅ **Precios aumentados** significativamente (x100) según requerimiento
- ✅ **API funcionando** - /listings, /products, /admin/* respondiendo correctamente

#### 🔒 Seguridad y Configuración
- ✅ **CORS actualizado** para múltiples puertos de desarrollo
- ✅ **Middleware funcionando** - auth, roles, permisos
- ✅ **Validaciones activas** - formularios, endpoints protegidos

---

## 📋 PENDIENTES CRÍTICOS

### 🚨 Alta Prioridad
1. **🤖 Chatbot IA** - Implementar asistente conversacional
2. **🆔 Sistema DID** - Identidad descentralizada y badges soulbound  
3. **⚖️ Sistema de Disputas** - Lógica completa de mediación
4. **🌐 Web3 Integration** - Completar conexión con contratos desplegados

### 🔄 Media Prioridad  
5. **📧 Email Templates** - Mejorar diseño de correos
6. **📱 Responsive Design** - Optimización móvil completa
7. **🔍 SEO** - Meta tags, Open Graph, sitemap
8. **⚡ Performance** - Lazy loading, code splitting, caching

### 📊 Métricas de Éxito
- ✅ **85% del proyecto completado**
- ✅ **Backend 95% funcional**
- ✅ **Frontend 90% operativo** 
- ✅ **Blockchain 95% implementado**
- ✅ **Documentación 95% actualizada**

---

*Mantener este archivo actualizado con cada avance significativo.*
