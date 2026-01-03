// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZStore Auction
 * @dev Contrato de subastas con anti-sniping, depósitos y distribución de fondos
 * @author ZStore Team
 */
contract Auction is ReentrancyGuard, Ownable {
    // ============ Estado ============
    uint256 private _auctionIds;
    
    address payable private _feeAccount;
    uint256 public platformFeePercent; // e.g., 5 for 5% (fee al finalizar)
    uint256 public outbidPenaltyPercent; // Penalización para postores superados (default 1%)
    uint256 public antiSnipingWindow; // Tiempo en segundos para extender (default 5 min)
    uint256 public antiSnipingExtension; // Cuánto tiempo extender (default 5 min)
    uint256 public minBidIncrementPercent; // Incremento mínimo porcentual (default 5%)
    uint256 public minAbsoluteBidIncrement; // Incremento mínimo absoluto en wei (ej: ~$20)
    uint256 public feePool; // Pool acumulado de fees por penalizaciones

    // ============ Estructuras ============
    struct AuctionItem {
        uint256 id;
        address payable seller;
        string externalId; // SKU o referencia al producto off-chain
        uint256 startingPrice;
        uint256 reservePrice; // Precio mínimo para que la venta sea válida
        uint256 currentBid;
        address payable highestBidder;
        uint256 startTime;
        uint256 endTime;
        uint256 originalEndTime; // Para tracking de extensiones
        AuctionState state;
        uint256 bidCount;
        uint256 depositAmount; // Depósito requerido para participar
        uint256 minBidIncrement; // Incremento mínimo absoluto para esta subasta (0 = usar global)
        uint256 minBidIncrementPct; // Incremento mínimo porcentual para esta subasta (0 = usar global)
    }

    enum AuctionState {
        Created,    // Subasta creada pero no iniciada
        Active,     // Subasta en curso
        Ended,      // Subasta terminada, pendiente de claim
        Claimed,    // Premio reclamado
        Cancelled,  // Subasta cancelada
        Failed      // No alcanzó precio de reserva
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // ============ Mappings ============
    mapping(uint256 => AuctionItem) public auctions;
    mapping(uint256 => Bid[]) public auctionBids; // Historial de pujas por subasta
    mapping(uint256 => mapping(address => uint256)) public deposits; // Depósitos por subasta y usuario
    mapping(address => uint256) public pendingWithdrawals;

    // ============ Eventos ============
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string externalId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 newEndTime
    );
    event AuctionExtended(
        uint256 indexed auctionId,
        uint256 newEndTime,
        uint256 extensionCount
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionFailed(uint256 indexed auctionId, string reason);
    event PrizeClaimed(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );
    event DepositPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event DepositRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event FundsWithdrawn(address indexed account, uint256 amount);
    event OutbidPenaltyApplied(uint256 indexed auctionId, address indexed bidder, uint256 penalty);
    event BidIncreased(uint256 indexed auctionId, address indexed bidder, uint256 addedAmount, uint256 newTotal);

    // ============ Constructor ============
    constructor(
        address payable initialFeeAccount,
        uint256 initialFeePercent
    ) Ownable(msg.sender) {
        require(initialFeeAccount != address(0), "Fee account cannot be zero");
        require(initialFeePercent <= 100, "Fee cannot exceed 100%");
        
        _feeAccount = initialFeeAccount;
        platformFeePercent = initialFeePercent;
        outbidPenaltyPercent = 1; // 1% retención para postores superados
        antiSnipingWindow = 5 minutes;
        antiSnipingExtension = 5 minutes;
        minBidIncrementPercent = 5; // 5%
        minAbsoluteBidIncrement = 0.005 ether; // ~$20 USD aprox
        feePool = 0;
    }

    // ============ Funciones Admin ============
    function updateFeeAccount(address payable newAccount) external onlyOwner {
        require(newAccount != address(0), "Cannot be zero address");
        _feeAccount = newAccount;
    }

    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee cannot exceed 100%");
        platformFeePercent = newFeePercent;
    }

    function updateAntiSnipingParams(
        uint256 newWindow,
        uint256 newExtension
    ) external onlyOwner {
        antiSnipingWindow = newWindow;
        antiSnipingExtension = newExtension;
    }

    function updateMinBidIncrement(uint256 newPercent) external onlyOwner {
        require(newPercent > 0 && newPercent <= 50, "Invalid increment");
        minBidIncrementPercent = newPercent;
    }

    function updateMinAbsoluteBidIncrement(uint256 newAmount) external onlyOwner {
        minAbsoluteBidIncrement = newAmount;
    }

    function updateOutbidPenalty(uint256 newPercent) external onlyOwner {
        require(newPercent <= 10, "Penalty cannot exceed 10%");
        outbidPenaltyPercent = newPercent;
    }

    /**
     * @dev Retirar fees acumulados (solo admin)
     */
    function withdrawFeePool() external onlyOwner nonReentrant {
        require(feePool > 0, "No fees to withdraw");
        uint256 amount = feePool;
        feePool = 0;
        (bool success, ) = _feeAccount.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // ============ Funciones Principales ============
    
    /**
     * @dev Crear una nueva subasta
     * @param externalId Referencia al producto off-chain (SKU, etc.)
     * @param startingPrice Precio inicial en wei
     * @param reservePrice Precio mínimo para que sea válida
     * @param duration Duración en segundos
     * @param depositRequired Depósito requerido para pujar (0 = sin depósito)
     * @param startImmediately Si true, inicia ahora; si false, queda en Created
     * @param customMinBidIncrement Incremento mínimo absoluto en wei (0 = usar global)
     * @param customMinBidIncrementPct Incremento mínimo porcentual (0 = usar global)
     */
    function createAuction(
        string calldata externalId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration,
        uint256 depositRequired,
        bool startImmediately,
        uint256 customMinBidIncrement,
        uint256 customMinBidIncrementPct
    ) external returns (uint256) {
        require(startingPrice > 0, "Starting price must be > 0");
        require(duration >= 1 hours, "Duration must be at least 1 hour");
        require(duration <= 30 days, "Duration cannot exceed 30 days");
        require(reservePrice >= startingPrice, "Reserve must be >= starting price");

        _auctionIds++;
        uint256 auctionId = _auctionIds;

        uint256 startTime = startImmediately ? block.timestamp : 0;
        uint256 endTime = startImmediately ? block.timestamp + duration : 0;

        auctions[auctionId] = AuctionItem({
            id: auctionId,
            seller: payable(msg.sender),
            externalId: externalId,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            currentBid: 0,
            highestBidder: payable(address(0)),
            startTime: startTime,
            endTime: endTime,
            originalEndTime: endTime,
            state: startImmediately ? AuctionState.Active : AuctionState.Created,
            bidCount: 0,
            depositAmount: depositRequired,
            minBidIncrement: customMinBidIncrement,
            minBidIncrementPct: customMinBidIncrementPct
        });

        emit AuctionCreated(
            auctionId,
            msg.sender,
            externalId,
            startingPrice,
            reservePrice,
            startTime,
            endTime
        );

        return auctionId;
    }

    /**
     * @dev Crear una nueva subasta (versión simplificada - usa valores globales)
     */
    function createAuctionSimple(
        string calldata externalId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration,
        uint256 depositRequired,
        bool startImmediately
    ) external returns (uint256) {
        return this.createAuction(
            externalId,
            startingPrice,
            reservePrice,
            duration,
            depositRequired,
            startImmediately,
            0, // usar minAbsoluteBidIncrement global
            0  // usar minBidIncrementPercent global
        );
    }

    /**
     * @dev Iniciar una subasta que estaba en estado Created
     */
    function startAuction(uint256 auctionId, uint256 duration) external {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.seller == msg.sender || owner() == msg.sender, "Not authorized");
        require(auction.state == AuctionState.Created, "Auction already started");
        require(duration >= 1 hours, "Duration must be at least 1 hour");

        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + duration;
        auction.originalEndTime = auction.endTime;
        auction.state = AuctionState.Active;
    }

    /**
     * @dev Depositar fondos para participar en una subasta
     */
    function placeDeposit(uint256 auctionId) external payable nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(auction.depositAmount > 0, "No deposit required");
        require(msg.value >= auction.depositAmount, "Insufficient deposit");
        require(deposits[auctionId][msg.sender] == 0, "Already deposited");

        deposits[auctionId][msg.sender] = msg.value;

        emit DepositPlaced(auctionId, msg.sender, msg.value);
    }

    /**
     * @dev Realizar una puja
     */
    function placeBid(uint256 auctionId) external payable nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        
        // Verificar depósito si es requerido
        if (auction.depositAmount > 0) {
            require(
                deposits[auctionId][msg.sender] >= auction.depositAmount,
                "Must place deposit first"
            );
        }

        // Calcular puja mínima usando el MAYOR entre incremento porcentual y absoluto
        uint256 minBid;
        if (auction.currentBid == 0) {
            minBid = auction.startingPrice;
        } else {
            // Usar valores de la subasta o globales si son 0
            uint256 pctToUse = auction.minBidIncrementPct > 0 
                ? auction.minBidIncrementPct 
                : minBidIncrementPercent;
            uint256 absToUse = auction.minBidIncrement > 0 
                ? auction.minBidIncrement 
                : minAbsoluteBidIncrement;
            
            // Calcular ambos incrementos
            uint256 percentIncrement = (auction.currentBid * pctToUse) / 100;
            uint256 absoluteIncrement = absToUse;
            
            // Usar el MAYOR de los dos para evitar micro-pujas
            uint256 increment = percentIncrement > absoluteIncrement 
                ? percentIncrement 
                : absoluteIncrement;
            
            minBid = auction.currentBid + increment;
        }
        
        require(msg.value >= minBid, "Bid too low");

        // Acreditar fondos al pujador anterior con penalización del 1%
        if (auction.highestBidder != address(0) && auction.currentBid > 0) {
            // Calcular penalización (1% por defecto)
            uint256 penalty = (auction.currentBid * outbidPenaltyPercent) / 100;
            uint256 refundAmount = auction.currentBid - penalty;
            
            // El 99% va al postor superado, 1% al feePool
            pendingWithdrawals[auction.highestBidder] += refundAmount;
            feePool += penalty;
            
            emit OutbidPenaltyApplied(auctionId, auction.highestBidder, penalty);
        }

        // Actualizar estado
        auction.currentBid = msg.value;
        auction.highestBidder = payable(msg.sender);
        auction.bidCount++;

        // Guardar en historial
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Anti-sniping: extender si estamos en los últimos minutos
        uint256 newEndTime = auction.endTime;
        if (auction.endTime - block.timestamp <= antiSnipingWindow) {
            newEndTime = block.timestamp + antiSnipingExtension;
            auction.endTime = newEndTime;
            
            emit AuctionExtended(
                auctionId,
                newEndTime,
                auction.bidCount
            );
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, newEndTime);
    }

    /**
     * @dev Incrementar oferta existente (solo el mejor postor actual)
     * Permite añadir más ETH a la puja sin penalización
     */
    function increaseBid(uint256 auctionId) external payable nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.sender == auction.highestBidder, "Not the highest bidder");
        require(msg.value > 0, "Must send ETH to increase bid");

        // Sumar al bid existente
        uint256 newTotal = auction.currentBid + msg.value;
        auction.currentBid = newTotal;

        // Guardar en historial
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: newTotal,
            timestamp: block.timestamp
        }));

        // Anti-sniping también aplica aquí
        uint256 newEndTime = auction.endTime;
        if (auction.endTime - block.timestamp <= antiSnipingWindow) {
            newEndTime = block.timestamp + antiSnipingExtension;
            auction.endTime = newEndTime;
            
            emit AuctionExtended(auctionId, newEndTime, auction.bidCount);
        }

        emit BidIncreased(auctionId, msg.sender, msg.value, newTotal);
    }

    /**
     * @dev Finalizar una subasta (puede llamar cualquiera después de endTime)
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended yet");

        // Verificar si alcanzó precio de reserva
        if (auction.currentBid < auction.reservePrice) {
            auction.state = AuctionState.Failed;
            
            // Devolver puja al mayor pujador
            if (auction.highestBidder != address(0) && auction.currentBid > 0) {
                pendingWithdrawals[auction.highestBidder] += auction.currentBid;
            }
            
            emit AuctionFailed(auctionId, "Reserve price not met");
            return;
        }

        auction.state = AuctionState.Ended;

        emit AuctionEnded(auctionId, auction.highestBidder, auction.currentBid);
    }

    /**
     * @dev El ganador reclama el premio (confirma la compra)
     * Los fondos se distribuyen al vendedor y fee account
     */
    function claimPrize(uint256 auctionId) external nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(auction.state == AuctionState.Ended, "Auction not in ended state");
        require(msg.sender == auction.highestBidder, "Only winner can claim");

        // Calcular distribución
        uint256 platformFee = (auction.currentBid * platformFeePercent) / 100;
        uint256 sellerProceeds = auction.currentBid - platformFee;

        // Acreditar fondos
        pendingWithdrawals[_feeAccount] += platformFee;
        pendingWithdrawals[auction.seller] += sellerProceeds;

        auction.state = AuctionState.Claimed;

        emit PrizeClaimed(auctionId, msg.sender, sellerProceeds);
    }

    /**
     * @dev Cancelar una subasta (solo vendedor o admin, antes de que haya pujas)
     */
    function cancelAuction(uint256 auctionId) external {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(
            auction.seller == msg.sender || owner() == msg.sender,
            "Not authorized"
        );
        require(
            auction.state == AuctionState.Created || 
            auction.state == AuctionState.Active,
            "Cannot cancel"
        );
        require(auction.bidCount == 0, "Cannot cancel after bids placed");

        auction.state = AuctionState.Cancelled;

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Reclamar depósito después de que termine la subasta
     */
    function refundDeposit(uint256 auctionId) external nonReentrant {
        AuctionItem storage auction = auctions[auctionId];
        
        require(auction.id != 0, "Auction does not exist");
        require(
            auction.state == AuctionState.Ended ||
            auction.state == AuctionState.Claimed ||
            auction.state == AuctionState.Failed ||
            auction.state == AuctionState.Cancelled,
            "Auction still active"
        );

        uint256 depositAmount = deposits[auctionId][msg.sender];
        require(depositAmount > 0, "No deposit to refund");

        // El ganador no recupera el depósito (se descuenta del pago)
        if (msg.sender == auction.highestBidder && 
            (auction.state == AuctionState.Ended || auction.state == AuctionState.Claimed)) {
            revert("Winner deposit applied to purchase");
        }

        deposits[auctionId][msg.sender] = 0;
        pendingWithdrawals[msg.sender] += depositAmount;

        emit DepositRefunded(auctionId, msg.sender, depositAmount);
    }

    /**
     * @dev Retirar fondos acumulados (pujas superadas, depósitos, ganancias)
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // ============ View Functions ============
    
    function getAuction(uint256 auctionId) external view returns (AuctionItem memory) {
        return auctions[auctionId];
    }

    function getBidHistory(uint256 auctionId) external view returns (Bid[] memory) {
        return auctionBids[auctionId];
    }

    function getMinBidAmount(uint256 auctionId) external view returns (uint256) {
        AuctionItem storage auction = auctions[auctionId];
        if (auction.currentBid == 0) {
            return auction.startingPrice;
        }
        
        // Usar valores de la subasta o globales si son 0
        uint256 pctToUse = auction.minBidIncrementPct > 0 
            ? auction.minBidIncrementPct 
            : minBidIncrementPercent;
        uint256 absToUse = auction.minBidIncrement > 0 
            ? auction.minBidIncrement 
            : minAbsoluteBidIncrement;
        
        // Calcular ambos incrementos
        uint256 percentIncrement = (auction.currentBid * pctToUse) / 100;
        uint256 absoluteIncrement = absToUse;
        
        // Usar el MAYOR de los dos
        uint256 increment = percentIncrement > absoluteIncrement 
            ? percentIncrement 
            : absoluteIncrement;
        
        return auction.currentBid + increment;
    }

    /**
     * @dev Obtener detalles de incrementos mínimos de una subasta
     */
    function getMinBidInfo(uint256 auctionId) external view returns (
        uint256 minBidRequired,
        uint256 percentIncrement,
        uint256 absoluteIncrement,
        uint256 pctUsed,
        uint256 absUsed
    ) {
        AuctionItem storage auction = auctions[auctionId];
        
        pctUsed = auction.minBidIncrementPct > 0 
            ? auction.minBidIncrementPct 
            : minBidIncrementPercent;
        absUsed = auction.minBidIncrement > 0 
            ? auction.minBidIncrement 
            : minAbsoluteBidIncrement;
        
        if (auction.currentBid == 0) {
            return (auction.startingPrice, 0, absUsed, pctUsed, absUsed);
        }
        
        percentIncrement = (auction.currentBid * pctUsed) / 100;
        absoluteIncrement = absUsed;
        
        uint256 increment = percentIncrement > absoluteIncrement 
            ? percentIncrement 
            : absoluteIncrement;
        
        minBidRequired = auction.currentBid + increment;
    }

    function isAuctionActive(uint256 auctionId) external view returns (bool) {
        AuctionItem storage auction = auctions[auctionId];
        return auction.state == AuctionState.Active && 
               block.timestamp >= auction.startTime &&
               block.timestamp < auction.endTime;
    }

    function getTimeRemaining(uint256 auctionId) external view returns (uint256) {
        AuctionItem storage auction = auctions[auctionId];
        if (block.timestamp >= auction.endTime) {
            return 0;
        }
        return auction.endTime - block.timestamp;
    }

    function getTotalAuctions() external view returns (uint256) {
        return _auctionIds;
    }

    function getUserDeposit(uint256 auctionId, address user) external view returns (uint256) {
        return deposits[auctionId][user];
    }

    function getFeePool() external view returns (uint256) {
        return feePool;
    }

    function getOutbidPenaltyPercent() external view returns (uint256) {
        return outbidPenaltyPercent;
    }
}
