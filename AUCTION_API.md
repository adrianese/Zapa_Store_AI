# Subastas: estructura de datos y endpoints

## 1. Estructura de datos (modelo)

### Tabla `auctions`
- id
- status: pending | active | paused | finished | cancelled
- start_at
- end_at
- starting_bid_minor
- reserve_price_minor
- current_bid_minor
- winner_id (nullable)
- rules (json, opcional)
- created_at, updated_at

### Tabla pivote `auction_product`
- id
- auction_id
- product_id

### Tabla `bids`
- id
- auction_id
- user_id
- amount_minor
- tx_hash (blockchain)
- signature (opcional)
- bid_at

## 2. Endpoints RESTful

### Subastas (admin)
- GET    /auctions                → Listar subastas
- POST   /auctions                → Crear subasta (con productos, fechas, monto inicio)
- GET    /auctions/{id}           → Detalle subasta (productos, pujas, estado)
- PUT    /auctions/{id}           → Editar subasta (fechas, reglas, productos)
- DELETE /auctions/{id}           → Eliminar subasta
- POST   /auctions/{id}/pause     → Pausar subasta
- POST   /auctions/{id}/resume    → Reanudar subasta

### Productos en subasta
- GET    /auctions/{id}/products  → Listar productos de la subasta
- POST   /auctions/{id}/products  → Agregar/quitar productos

### Pujas
- GET    /auctions/{id}/bids      → Historial de pujas
- POST   /auctions/{id}/bid       → Realizar puja

### Blockchain
- POST   /auctions/{id}/sync      → Sincronizar estado con contrato inteligente

---

Esta estructura permite subastas de uno o más productos, control de estado (pausa/reanudar), historial transparente y fácil integración blockchain. Se puede ampliar con reglas avanzadas, depósitos, anti-sniping, etc.