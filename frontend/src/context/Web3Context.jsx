import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') {
            setError('Metamask is not installed. Please install it to connect your wallet.');
            return;
        }

        try {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            await web3Provider.send('eth_requestAccounts', []);
            
            const web3Signer = web3Provider.getSigner();
            const userAddress = await web3Signer.getAddress();
            const network = await web3Provider.getNetwork();

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAddress(userAddress);
            setChainId(network.chainId);
            setIsConnected(true);
            setError(null);

        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError('Failed to connect wallet. Please try again.');
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setSigner(null);
        setAddress(null);
        setChainId(null);
        setIsConnected(false);
        // Note: This doesn't fully "disconnect" from Metamask, just from the app's state.
    }, []);

    // Handle chain and account changes
    useEffect(() => {
        if (provider) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                } else {
                    disconnectWallet();
                }
            };

            const handleChainChanged = (_chainId) => {
                // Reload the page to reset state on network change
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [provider, disconnectWallet]);

    const value = {
        provider,
        signer,
        address,
        chainId,
        isConnected,
        error,
        connectWallet,
        disconnectWallet,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
