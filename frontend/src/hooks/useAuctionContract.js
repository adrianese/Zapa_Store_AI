import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import AuctionABI from '../contracts/AuctionABI.json';
import addresses from '../contracts/addresses.json';

// Obtener dirección del contrato según la red
const getContractAddress = (chainId) => {
  // Buscar la red por chainId
  for (const [networkName, networkData] of Object.entries(addresses.networks || {})) {
    if (networkData.chainId === chainId && networkData.Auction) {
      return networkData.Auction;
    }
  }
  // Fallback a variable de entorno
  return import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS || '';
};

export const useAuctionContract = () => {
  const { signer, provider, address, chainId, isConnected } = useWeb3();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contractAddress, setContractAddress] = useState('');

  // Initialize contract (ethers v5 syntax)
  useEffect(() => {
    if (provider && chainId) {
      const addr = getContractAddress(chainId);
      setContractAddress(addr);
      
      if (addr) {
        const auctionContract = new ethers.Contract(
          addr,
          AuctionABI,
          signer || provider
        );
        setContract(auctionContract);
      } else {
        setContract(null);
      }
    }
  }, [provider, signer, chainId]);

  // Get auction details
  const getAuction = useCallback(async (auctionId) => {
    if (!contract) return null;
    try {
      const auction = await contract.getAuction(auctionId);
      return {
        id: auction.id.toString(),
        seller: auction.seller,
        externalId: auction.externalId,
        startingPrice: ethers.utils.formatEther(auction.startingPrice),
        reservePrice: ethers.utils.formatEther(auction.reservePrice),
        currentBid: ethers.utils.formatEther(auction.currentBid),
        highestBidder: auction.highestBidder,
        startTime: new Date(Number(auction.startTime) * 1000),
        endTime: new Date(Number(auction.endTime) * 1000),
        state: auction.state,
        bidCount: auction.bidCount.toString(),
        depositAmount: ethers.utils.formatEther(auction.depositAmount),
        minBidIncrement: ethers.utils.formatEther(auction.minBidIncrement),
        minBidIncrementPct: auction.minBidIncrementPct.toString(),
      };
    } catch (err) {
      console.error('Error getting auction:', err);
      setError(err.message);
      return null;
    }
  }, [contract]);

  // Get minimum bid info (NEW: anti micro-pujas info)
  const getMinBidInfo = useCallback(async (auctionId) => {
    if (!contract) return null;
    try {
      const info = await contract.getMinBidInfo(auctionId);
      return {
        minBidRequired: ethers.utils.formatEther(info.minBidRequired),
        percentIncrement: ethers.utils.formatEther(info.percentIncrement),
        absoluteIncrement: ethers.utils.formatEther(info.absoluteIncrement),
        pctUsed: info.pctUsed.toString(),
        absUsed: ethers.utils.formatEther(info.absUsed),
      };
    } catch (err) {
      console.error('Error getting min bid info:', err);
      return null;
    }
  }, [contract]);

  // Get minimum bid amount
  const getMinBidAmount = useCallback(async (auctionId) => {
    if (!contract) return null;
    try {
      const minBid = await contract.getMinBidAmount(auctionId);
      return ethers.utils.formatEther(minBid);
    } catch (err) {
      console.error('Error getting min bid:', err);
      return null;
    }
  }, [contract]);

  // Get time remaining
  const getTimeRemaining = useCallback(async (auctionId) => {
    if (!contract) return 0;
    try {
      const time = await contract.getTimeRemaining(auctionId);
      return Number(time);
    } catch (err) {
      console.error('Error getting time remaining:', err);
      return 0;
    }
  }, [contract]);

  // Check if auction is active
  const isAuctionActive = useCallback(async (auctionId) => {
    if (!contract) return false;
    try {
      return await contract.isAuctionActive(auctionId);
    } catch (err) {
      console.error('Error checking auction status:', err);
      return false;
    }
  }, [contract]);

  // Get pending withdrawals for user (Withdraw Pattern)
  const getPendingWithdrawals = useCallback(async (userAddress = address) => {
    if (!contract || !userAddress) return '0';
    try {
      const pending = await contract.pendingWithdrawals(userAddress);
      return ethers.utils.formatEther(pending);
    } catch (err) {
      console.error('Error getting pending withdrawals:', err);
      return '0';
    }
  }, [contract, address]);

  // Get bid history
  const getBidHistory = useCallback(async (auctionId) => {
    if (!contract) return [];
    try {
      const bids = await contract.getBidHistory(auctionId);
      return bids.map(bid => ({
        bidder: bid.bidder,
        amount: ethers.utils.formatEther(bid.amount),
        timestamp: new Date(Number(bid.timestamp) * 1000),
      }));
    } catch (err) {
      console.error('Error getting bid history:', err);
      return [];
    }
  }, [contract]);

  // Place a bid (ethers v5 syntax)
  const placeBid = useCallback(async (auctionId, bidAmountEth) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.placeBid(auctionId, {
        value: ethers.utils.parseEther(bidAmountEth.toString())
      });
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      console.error('Error placing bid:', err);
      setError(err.reason || err.message);
      setLoading(false);
      return null;
    }
  }, [contract, signer]);

  // Increase existing bid (for highest bidder - NO PENALTY)
  const increaseBid = useCallback(async (auctionId, additionalAmountEth) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.increaseBid(auctionId, {
        value: ethers.utils.parseEther(additionalAmountEth.toString())
      });
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      console.error('Error increasing bid:', err);
      setError(err.reason || err.message);
      setLoading(false);
      return null;
    }
  }, [contract, signer]);

  // Withdraw pending funds (Pull over Push pattern)
  const withdraw = useCallback(async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.withdraw();
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(err.reason || err.message);
      setLoading(false);
      return null;
    }
  }, [contract, signer]);

  // Place deposit (if required by auction)
  const placeDeposit = useCallback(async (auctionId, depositAmountEth) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.placeDeposit(auctionId, {
        value: ethers.utils.parseEther(depositAmountEth.toString())
      });
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      console.error('Error placing deposit:', err);
      setError(err.reason || err.message);
      setLoading(false);
      return null;
    }
  }, [contract, signer]);

  // Get user's deposit for auction
  const getUserDeposit = useCallback(async (auctionId, userAddress = address) => {
    if (!contract || !userAddress) return '0';
    try {
      const deposit = await contract.getUserDeposit(auctionId, userAddress);
      return ethers.utils.formatEther(deposit);
    } catch (err) {
      console.error('Error getting deposit:', err);
      return '0';
    }
  }, [contract, address]);

  // Check if user is highest bidder
  const isHighestBidder = useCallback(async (auctionId) => {
    if (!contract || !address) return false;
    try {
      const auction = await contract.auctions(auctionId);
      return auction.highestBidder.toLowerCase() === address.toLowerCase();
    } catch (err) {
      console.error('Error checking highest bidder:', err);
      return false;
    }
  }, [contract, address]);

  // Format ETH to display
  const formatEth = (value) => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (num < 0.0001) return '< 0.0001 ETH';
    return `${num.toFixed(4)} ETH`;
  };

  // Short address for display
  const shortAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return {
    contract,
    loading,
    error,
    isConnected,
    address,
    contractAddress,
    // Read functions
    getAuction,
    getMinBidInfo,
    getMinBidAmount,
    getTimeRemaining,
    isAuctionActive,
    getPendingWithdrawals,
    getBidHistory,
    getUserDeposit,
    isHighestBidder,
    // Write functions
    placeBid,
    increaseBid,
    withdraw,
    placeDeposit,
    // Utilities
    formatEth,
    shortAddress,
  };
};

export default useAuctionContract;
