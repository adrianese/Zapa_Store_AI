# API_DOC.md

## Endpoints RESTful Backend Admin (Laravel)

### Autenticación y Usuarios
- POST   /auth/register         → Registro de usuario
- POST   /auth/login            → Login de usuario
- GET    /auth/me               → Perfil autenticado
- POST   /auth/logout           → Logout
- POST   /auth/logout-all       → Logout de todas las sesiones
- GET    /users                 → Listar usuarios (admin)
- GET    /users/{id}            → Detalle usuario
- PUT    /users/{id}            → Actualizar usuario
- DELETE /users/{id}            → Eliminar usuario
- POST   /users/{id}/role       → Asignar rol
- POST   /users/{id}/verify-did → Verificar identidad (DID)

### Productos y Stock
- GET    /products              → Listar productos
- POST   /products              → Crear producto
- GET    /products/{id}         → Detalle producto
- PUT    /products/{id}         → Actualizar producto
- DELETE /products/{id}         → Eliminar producto
- POST   /products/{id}/sizes   → Agregar/actualizar talles
- POST   /products/{id}/stock   → Actualizar stock
- POST   /products/{id}/images  → Subir imágenes

### Pedidos y Órdenes
- GET    /orders                → Listar pedidos
- POST   /orders                → Crear pedido
- GET    /orders/{id}           → Detalle pedido
- PUT    /orders/{id}           → Actualizar pedido
- DELETE /orders/{id}           → Eliminar pedido

### Subastas y Pujas
- GET    /auctions              → Listar subastas
- POST   /auctions              → Crear subasta
- GET    /auctions/{id}         → Detalle subasta
- PUT    /auctions/{id}         → Actualizar subasta
- DELETE /auctions/{id}         → Eliminar subasta
- POST   /auctions/{id}/bid     → Realizar puja
- GET    /auctions/{id}/bids    → Historial de pujas

### Votaciones y Disputas
- GET    /votes                 → Listar votaciones
- POST   /votes                 → Crear votación
- GET    /votes/{id}            → Detalle votación
- POST   /disputes/{id}/vote    → Votar en disputa

### Escrow y Pagos
- GET    /escrows               → Listar escrows
- POST   /escrows               → Crear escrow
- GET    /escrows/{id}          → Detalle escrow
- POST   /escrows/{id}/release  → Liberar fondos
- POST   /escrows/{id}/dispute  → Iniciar disputa
- GET    /payments              → Listar pagos
- POST   /payments/webhook      → Webhook de pagos

### Identidad y Reputación
- GET    /identity/me           → Ver identidad
- POST   /identity/verify       → Verificar identidad
- GET    /identity/badges       → Listar badges
- POST   /identity/badges       → Asignar badge

### Chatbot y Notificaciones
- POST   /chatbot/message       → Enviar mensaje al chatbot
- GET    /notifications         → Listar notificaciones
- POST   /notifications/read    → Marcar como leídas

### Admin y Métricas
- GET    /admin/metrics         → Métricas generales
- GET    /admin/reports         → Reportes avanzados
- GET    /admin/audit-logs      → Auditoría de acciones

---

Todos los endpoints deben estar protegidos por roles y permisos según corresponda. Los endpoints de integración (webhooks, chatbot) deben validar autenticidad y seguridad.

Este archivo debe mantenerse actualizado con cada nuevo módulo o endpoint agregado.