# Tests de administración (admin)

Esta carpeta contiene pruebas automatizadas para las funcionalidades críticas del panel admin:

- ProductAdminTest.php: Prueba el CRUD de productos, talles y stock.
- AuctionAdminTest.php: Prueba la creación de subastas con múltiples productos, pausa y reanudación.
- OrderAdminTest.php: Prueba la gestión de órdenes (listar, actualizar estado).
- UserAdminTest.php: Prueba la gestión de usuarios y roles.
- BidAuctionTest.php: Prueba el flujo de pujas en subastas.

Cada archivo incluye tests unitarios y de integración para asegurar la robustez y seguridad de los flujos principales.

Ejecuta las pruebas con:

```
php artisan test --testsuite=admin
```

Asegúrate de tener la base de datos de testing configurada y migraciones actualizadas.
