# Pendientes y Faltantes - ZStore AI

## 🔴 Críticos (bloquean ejecución)

## ✅ Realizados

### Backend
- [x] Ejecutar migraciones: `php artisan migrate`
- [x] Crear archivo `.env` si no existe (copiar de `.env.example`)
- [x] Verificar conexión a base de datos `zstore_ai`

### Frontend
- [x] Instalar dependencias: `npm install`
- [x] Verificar archivo `.env` con `VITE_API_URL`

---

## 🟡 Funcionalidades pendientes

#### Checklist admin (ver CHECKLIST_ADMIN.md)
- [ ] CRUD productos: crear, editar, eliminar, stock, imágenes
- [ ] CRUD subastas: crear, editar, pausar, eliminar, productos, sincronizar blockchain
- [ ] Seguridad/roles: acceso solo admin, protección rutas
- [ ] Integración: productos en subastas, reflejo en frontend, flujos desde panel admin

### Backend
- [ ] Modelo Vote y VoteController (votación en disputas/subastas)
- [ ] ChatbotController (intents, integración IA)
- [ ] BidController separado (actualmente en AuctionController)
- [ ] EscrowController (integración con contratos)
- [ ] IdentityController (verificación DID)
- [ ] Seeders para datos de prueba (productos, usuarios)
- [ ] Tests unitarios y de integración

### Frontend
- [ ] Página "Mis Órdenes" para usuarios autenticados
- [ ] Widget de Chatbot flotante
- [ ] Integración Web3/Wallet (Metamask)
- [ ] Sistema de verificación DID
- [ ] Página de seguimiento de envío
- [ ] Página de perfil de usuario

### Contratos (Solidity)
- [ ] Configurar Hardhat en carpeta `/contracts`
- [ ] Implementar Escrow.sol
- [ ] Implementar Auction.sol
- [ ] Tests de contratos
- [ ] Scripts de deploy

### Integraciones
- [ ] Pasarela de pago real (Mercado Pago / Stripe)
- [ ] API de carriers (Andreani/OCA) para cotización real
- [ ] Servicio de email (notificaciones)
- [ ] Servicio de IA para chatbot

---

## 🟢 Completado

### Backend
- [x] AuthController (register, login, logout, profile)
- [x] ProductController
- [x] OrderController (CRUD completo)
- [x] ShipmentController (quote, track)
- [x] AuctionController
- [x] PaymentController (estructura base)
- [x] DetallesController
- [x] Modelos: User, Product, Order, Shipment, Payment, Auction, Bid, Escrow, Identity, AuditLog
- [x] Migraciones completas
- [x] Rutas API organizadas (públicas/protegidas)

### Frontend
- [x] Página Inicio (catálogo)
- [x] Página Producto (detalle)
- [x] Página Carrito
- [x] Página Checkout (3 pasos)
- [x] Página Subasta
- [x] Página Admin
- [x] Páginas Login/Register
- [x] AuthContext (estado de autenticación)
- [x] CarritoContext (estado del carrito)
- [x] ProtectedRoute (rutas protegidas)
- [x] Header con menú de usuario
- [x] Estilos responsive

---

## 📝 Notas

- Base de datos: MySQL `zstore_ai`
- Puerto backend: 8000
- Puerto frontend: 5173
- Sin Docker (desarrollo local)

---

## 🐛 Bugs conocidos

- [ ] (Agregar bugs que surjan durante testing)

---

*Última actualización: 31/12/2025*

Mejorar 
Modal Talles:
 quiero que el modal sea un poco mas pequeño que se inserte un poco mas abajo en lo que se refiere a altura de pantalla y que la font sea mas pequeña. y verifica los tonos para el DMode.