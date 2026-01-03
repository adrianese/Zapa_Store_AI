# 🔨 Flujo de Subasta - ZStore

## Diagrama de Flujo Principal

```mermaid
flowchart TD
    A[🚀 Admin crea subasta] --> B{Subasta activa?}
    B -->|Sí| C[👤 Usuario envía puja]
    B -->|No/Expirada| K[⏰ Subasta finalizada]
    
    C --> D{msg.value >= minBid?}
    D -->|No| E[❌ Rechazado: Bid too low]
    D -->|Sí| F{Hay postor anterior?}
    
    F -->|No| G[✅ Primera puja registrada]
    F -->|Sí| H[💰 Calcular penalización 1%]
    
    H --> I[99% → pendingWithdrawals<br/>1% → feePool]
    I --> G
    
    G --> J{Tiempo < 5 min?}
    J -->|Sí| J1[⏱️ Anti-sniping: +5 min]
    J -->|No| J2[Sin extensión]
    J1 --> B
    J2 --> B
    
    K --> L{Hubo pujas?}
    L -->|No| M[🚫 Subasta fallida<br/>Sin ganador]
    L -->|Sí| N{currentBid >= reservePrice?}
    
    N -->|No| O[🚫 No alcanzó reserva<br/>Devolver al ganador]
    N -->|Sí| P[🏆 Ganador confirmado]
    
    P --> Q[Winner llama claimPrize]
    Q --> R[💵 Distribuir fondos:<br/>Seller + Platform Fee]
    
    style A fill:#10b981,color:#fff
    style P fill:#f59e0b,color:#fff
    style E fill:#ef4444,color:#fff
    style M fill:#6b7280,color:#fff
    style O fill:#6b7280,color:#fff
```

## Flujo de Retiro (Withdraw Pattern)

```mermaid
flowchart LR
    A[Postor superado] --> B[Saldo en pendingWithdrawals]
    B --> C[Usuario llama withdraw]
    C --> D{Tiene saldo > 0?}
    D -->|Sí| E[✅ Transferir ETH]
    D -->|No| F[❌ No funds to withdraw]
    E --> G[Saldo = 0]
    
    style E fill:#10b981,color:#fff
    style F fill:#ef4444,color:#fff
```

## Flujo de Incrementar Oferta

```mermaid
flowchart LR
    A[Highest Bidder] --> B[Llama increaseBid + ETH]
    B --> C{Es el highest bidder?}
    C -->|No| D[❌ Not the highest bidder]
    C -->|Sí| E[currentBid += msg.value]
    E --> F{Tiempo < 5 min?}
    F -->|Sí| G[⏱️ Extender tiempo]
    F -->|No| H[✅ Bid aumentado]
    G --> H
    
    style D fill:#ef4444,color:#fff
    style H fill:#10b981,color:#fff
```

---

## 📋 Estados de la Subasta

| Estado | Descripción |
|--------|-------------|
| `Created` | Subasta creada, aún no iniciada |
| `Active` | Subasta en curso, acepta pujas |
| `Ended` | Tiempo terminado, pendiente de claim |
| `Claimed` | Ganador reclamó el premio |
| `Cancelled` | Cancelada antes de pujas |
| `Failed` | No alcanzó precio de reserva |

---

## 💰 Distribución de Fondos

```
┌─────────────────────────────────────────────────────────┐
│                    PUJA SUPERADA                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Monto original: 1 ETH                                 │
│                                                         │
│   ├── 99% (0.99 ETH) → pendingWithdrawals[bidder]      │
│   │                                                     │
│   └── 1%  (0.01 ETH) → feePool (retención)             │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  SUBASTA FINALIZADA                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Monto ganador: 10 ETH                                 │
│                                                         │
│   ├── 95% (9.5 ETH)  → Vendedor                        │
│   │                                                     │
│   └── 5%  (0.5 ETH)  → Platform Fee                    │
│                                                         │
│   + feePool acumulado → Admin puede retirar            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad Implementada

| Mecanismo | Descripción |
|-----------|-------------|
| **ReentrancyGuard** | OpenZeppelin - Previene ataques de reentrancy |
| **Withdraw Pattern** | Usuario retira fondos, no envío automático |
| **Ownable** | Funciones admin restringidas al owner |
| **Validaciones** | Checks en cada función (estado, tiempo, montos) |
| **Anti-Sniping** | Extensión automática para evitar pujas de último segundo |

---

## 🎯 Funciones del Contrato

### Para Usuarios
```solidity
placeBid(auctionId)        // Realizar puja
increaseBid(auctionId)     // Aumentar puja existente (solo highest bidder)
withdraw()                 // Retirar fondos pendientes
placeDeposit(auctionId)    // Depositar garantía (si requerido)
refundDeposit(auctionId)   // Recuperar depósito
```

### Para Admin/Seller
```solidity
createAuction(...)         // Crear nueva subasta
startAuction(id, duration) // Iniciar subasta diferida
endAuction(auctionId)      // Finalizar subasta
cancelAuction(auctionId)   // Cancelar (solo sin pujas)
claimPrize(auctionId)      // Reclamar premio (winner)
withdrawFeePool()          // Retirar fees acumulados (admin)
```

### Configuración (Solo Owner)
```solidity
updatePlatformFee(%)       // Cambiar fee de plataforma
updateOutbidPenalty(%)     // Cambiar penalización (default 1%)
updateAntiSnipingParams()  // Configurar anti-sniping
updateMinBidIncrement(%)   // Cambiar incremento mínimo (default 5%)
```

---

## 📊 Ejemplo Práctico

**Subasta de Nike Air Max - Talle 42**

1. **Creación**: Admin crea subasta con precio base 0.5 ETH, reserva 1 ETH, duración 24h
2. **Puja 1**: Alice puja 0.6 ETH → `highestBidder = Alice`
3. **Puja 2**: Bob puja 1.0 ETH
   - Alice recibe: 0.6 × 0.99 = 0.594 ETH en `pendingWithdrawals`
   - feePool += 0.006 ETH
   - `highestBidder = Bob`
4. **Puja 3**: Charlie puja 1.2 ETH (en último minuto)
   - Bob recibe: 1.0 × 0.99 = 0.99 ETH
   - feePool += 0.01 ETH
   - ⏱️ Tiempo extendido +5 min (anti-sniping)
5. **Finalización**: Charlie gana
   - Seller recibe: 1.2 × 0.95 = 1.14 ETH
   - Platform recibe: 1.2 × 0.05 = 0.06 ETH
6. **Retiros**:
   - Alice llama `withdraw()` → recibe 0.594 ETH
   - Bob llama `withdraw()` → recibe 0.99 ETH
   - Admin llama `withdrawFeePool()` → recibe 0.016 ETH

---

*Documentación generada para ZStore - Sistema de Subastas Web3*
