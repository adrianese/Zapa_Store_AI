# ZStore AI

## Descripcion General

ZStore AI es un marketplace descentralizado que combina comercio electronico tradicional con tecnologia blockchain. El proyecto resuelve la necesidad de crear un sistema de compras en linea transparente, seguro y con mecanismos de confianza basados en contratos inteligentes, escrow automatizado y verificacion de identidad descentralizada (DID).

La plataforma permite:
- Compra y venta de productos con pagos tradicionales y criptomonedas
- Sistema de subastas con proteccion anti-sniping
- Escrow automatizado para proteger compradores y vendedores
- Sistema de disputas y mediacion transparente
- Verificacion de identidad y reputacion mediante badges soulbound
- Chatbot con inteligencia artificial para asistencia al usuario

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| React | 19.2.0 | Framework UI |
| Vite | 7.2.4 | Build tool y dev server |
| React Router DOM | 7.11.0 | Navegacion SPA |
| TanStack React Query | 5.90.16 | Manejo de estado servidor |
| Zustand | 5.0.9 | Estado global |
| Axios | 1.13.2 | Cliente HTTP |
| Ethers.js | 6.16.0 | Integracion Web3 |
| Bootstrap | 5.3.8 | Framework CSS |
| React Toastify | 11.0.5 | Notificaciones |
| SweetAlert2 | 11.26.17 | Modales y alertas |

### Backend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| PHP | 8.2+ | Lenguaje servidor |
| Laravel | 12.0 | Framework backend |
| Laravel Sanctum | 4.0 | Autenticacion API |
| Spatie Permission | 6.24 | Roles y permisos |
| Intervention Image | 3.11 | Procesamiento imagenes |
| Brick Money | 0.10.3 | Manejo de monedas |
| Guzzle | 7.10 | Cliente HTTP |
| PHPUnit | 11.5.3 | Testing |

### Blockchain / Smart Contracts
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Solidity | 0.8.20 | Contratos inteligentes |
| OpenZeppelin | - | Librerias de seguridad |

### Base de Datos
| Tecnologia | Proposito |
|------------|-----------|
| MySQL | Base de datos principal (zstore_ai) |

---

## Arquitectura del Proyecto

```
Zstore-ai/
├── backend/
│   └── zstore-api/          # API REST Laravel
│       ├── app/
│       │   ├── Http/Controllers/Api/   # Controladores
│       │   ├── Models/                 # Modelos Eloquent
│       │   ├── Services/               # Logica de negocio
│       │   └── Notifications/          # Notificaciones
│       ├── database/migrations/        # Migraciones
│       ├── routes/api.php              # Rutas API
│       └── config/                     # Configuracion
├── frontend/
│   └── zstore-web/          # Aplicacion React
│       └── src/
│           ├── components/  # Componentes reutilizables
│           ├── pages/       # Paginas de la aplicacion
│           ├── context/     # Contextos React
│           ├── routes/      # Configuracion de rutas
│           └── layouts/     # Layouts de pagina
├── contracts/               # Smart Contracts Solidity
│   └── Marketplace.sol      # Contrato principal

```

---

## Estado Actual

### Funcionalidades Completadas

#### Backend (Laravel API)
- [x] Sistema de autenticacion (registro, login, logout, perfil)
- [x] CRUD completo de productos con talles y stock
- [x] CRUD de ordenes y pedidos
- [x] Sistema de subastas y pujas
- [x] Controlador de envios (cotizacion y tracking)
- [x] Estructura base de pagos
- [x] Sistema de detalles de productos
- [x] Modelos completos: User, Product, Order, Shipment, Payment, Auction, Bid, Escrow, Identity, AuditLog, Vote
- [x] Migraciones de base de datos
- [x] Rutas API organizadas (publicas y protegidas)
- [x] Sistema de roles y permisos con Spatie

#### Frontend (React)
- [x] Pagina de inicio con catalogo de productos
- [x] Pagina de detalle de producto
- [x] Carrito de compras funcional
- [x] Checkout en 3 pasos
- [x] Pagina de subastas
- [x] Panel de administracion
- [x] Paginas de Login y Registro
- [x] AuthContext para estado de autenticacion
- [x] CarritoContext para estado del carrito
- [x] ProtectedRoute para rutas protegidas
- [x] Header con menu de usuario
- [x] Estilos responsive
- [x] Pagina de perfil de usuario
- [x] Pagina de seguimiento de envio
- [x] Pagina "Mis Ordenes"

#### Smart Contracts (Solidity)
- [x] Contrato Marketplace con sistema de escrow
- [x] Creacion y compra de items
- [x] Estados de transaccion (Created, Locked, Released, Disputed, Resolved)
- [x] Sistema de comisiones configurable
- [x] Mecanismo de disputas
- [x] Resolucion de disputas por administrador
- [x] Sistema de retiros (withdraw pattern)
- [x] Proteccion contra reentrancy

---

## Pendientes / Roadmap

### Alta Prioridad
- [ ] Modelo Vote y VoteController para votacion en disputas
- [ ] ChatbotController con integracion de IA
- [ ] BidController separado (actualmente en AuctionController)
- [ ] EscrowController con integracion de contratos
- [ ] IdentityController para verificacion DID
- [ ] Seeders para datos de prueba

### Blockchain
- [ ] Configurar Hardhat en carpeta /contracts
- [ ] Implementar Escrow.sol independiente
- [ ] Implementar Auction.sol con anti-sniping
- [ ] Tests de contratos inteligentes
- [ ] Scripts de deploy

### Frontend
- [ ] Widget de Chatbot flotante
- [ ] Integracion completa Web3/Wallet (MetaMask)
- [ ] Sistema de verificacion DID

### Integraciones Externas
- [ ] Pasarela de pago (Mercado Pago / Stripe)
- [ ] API de carriers (Andreani/OCA) para cotizacion real
- [ ] Servicio de email para notificaciones
- [ ] Servicio de IA para chatbot

### Testing
- [ ] Tests unitarios backend
- [ ] Tests de integracion
- [ ] Tests end-to-end

---

## Instalacion y Configuracion

### Requisitos Previos
- PHP 8.2 o superior
- Composer
- Node.js 18+ y npm
- MySQL 8.0+
- Git

### 1. Clonar el Repositorio
```bash
git clone <url-repositorio>
cd Zstore-ai
```

### 2. Configurar Backend (Laravel)
```bash
cd backend/zstore-api

# Instalar dependencias PHP
composer install

# Copiar archivo de entorno
cp .env.example .env

# Configurar variables de entorno en .env
# DB_DATABASE=zstore_ai
# DB_USERNAME=tu_usuario
# DB_PASSWORD=tu_password

# Generar clave de aplicacion
php artisan key:generate

# Ejecutar migraciones
php artisan migrate

# (Opcional) Ejecutar seeders
php artisan db:seed
```

### 3. Configurar Frontend (React)
```bash
cd frontend/zstore-web

# Instalar dependencias
npm install

# Crear archivo .env
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

### 4. Iniciar Servidores de Desarrollo

#### Terminal 1 - Backend:
```bash
cd backend/zstore-api
php artisan serve
# Servidor en http://localhost:8000
```

#### Terminal 2 - Frontend:
```bash
cd frontend/zstore-web
npm run dev
# Servidor en http://localhost:5173
```

---

## Scripts Disponibles

### Backend (Composer)
```bash
composer setup    # Instalacion completa
composer dev      # Servidor de desarrollo con hot reload
composer test     # Ejecutar tests
```

### Frontend (npm)
```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de produccion
npm run preview   # Preview del build
npm run lint      # Ejecutar ESLint
```

---

## Endpoints API Principales

### Autenticacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /auth/register | Registro de usuario |
| POST | /auth/login | Inicio de sesion |
| GET | /auth/me | Perfil del usuario autenticado |
| POST | /auth/logout | Cerrar sesion |

### Productos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /products | Listar productos |
| POST | /products | Crear producto |
| GET | /products/{id} | Detalle de producto |
| PUT | /products/{id} | Actualizar producto |
| DELETE | /products/{id} | Eliminar producto |

### Subastas
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /auctions | Listar subastas |
| POST | /auctions | Crear subasta |
| GET | /auctions/{id} | Detalle de subasta |
| POST | /auctions/{id}/bid | Realizar puja |
| GET | /auctions/{id}/bids | Historial de pujas |

### Ordenes
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /orders | Listar ordenes |
| POST | /orders | Crear orden |
| GET | /orders/{id} | Detalle de orden |

Para documentacion completa de la API, consultar [API_DOC.md](API_DOC.md).

---

## Estructura de Base de Datos

### Tablas Principales
- **users**: Usuarios del sistema con roles
- **products**: Catalogo de productos
- **product_sizes**: Talles y stock por producto
- **orders**: Ordenes de compra
- **auctions**: Subastas activas
- **auction_product**: Relacion subastas-productos
- **bids**: Pujas en subastas
- **payments**: Registro de pagos
- **shipments**: Informacion de envios
- **escrows**: Fondos en custodia
- **identities**: Verificacion de identidad
- **votes**: Votos en disputas
- **audit_logs**: Registro de auditorias
- **listings**: Publicaciones del marketplace

---

## Configuracion de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend Laravel | 8000 | http://localhost:8000 |
| Frontend React | 5173 | http://localhost:5173 |
| MySQL | 3306 | localhost |

---

## Notas de Desarrollo

- El proyecto no utiliza Docker, esta configurado para desarrollo local
- Base de datos MySQL con nombre `zstore_ai`
- Autenticacion basada en Laravel Sanctum (tokens)
- Los contratos inteligentes utilizan patron de seguridad de OpenZeppelin

---

## Documentacion Adicional

- [API_DOC.md](API_DOC.md) - Documentacion completa de endpoints
- [AUCTION_API.md](AUCTION_API.md) - Estructura de subastas
- [CHECKLIST_ADMIN.md](CHECKLIST_ADMIN.md) - Lista de verificacion admin
- [faltante.md](faltante.md) - Lista detallada de pendientes
- [first_step.md](first_step.md) - Arquitectura y roadmap del proyecto

---

## Creditos y Autoria

Proyecto desarrollado como marketplace descentralizado con integracion blockchain.

### Tecnologias y Frameworks
- Laravel Framework - Taylor Otwell y contribuidores
- React - Meta Open Source
- OpenZeppelin - Contratos inteligentes seguros
- Vite - Evan You y contribuidores

---

## Licencia

Este proyecto se encuentra bajo desarrollo activo. Contactar a los autores para informacion sobre licenciamiento.

---

*Ultima actualizacion: Enero 2026*
