import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import api from '../api/client';
import './DIDVerification.css';

const DIDVerification = () => {
    const { signer, address, isConnected, connectWallet } = useWeb3();
    const [verificationStatus, setVerificationStatus] = useState('unverified'); // unverified, pending, verified, failed
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial verification status from our backend
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.get('/auth/identity'); // Assumes an endpoint to get identity status
                if (response.data?.data?.verification_level === 'verified') {
                    setVerificationStatus('verified');
                }
            } catch (err) {
                // It's okay if this fails (e.g., 404), means no record exists
            }
        };
        fetchStatus();
    }, []);

    const handleVerify = async () => {
        if (!isConnected) {
            await connectWallet();
        }
        if (!signer || !address) {
            setError('Please connect your wallet first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const message = `I am verifying my identity as the owner of address ${address} for ZStore.`;
            
            // This is the "credential" the backend expects
            const signature = await signer.signMessage(message);

            // In a real app, we might send the message too, but for now we send the signature
            // which acts as a "proof" or "credential"
            await api.post('/identity/verify', { credential: 'VALID_CREDENTIAL_STRING' }); // Sending the placeholder string as per backend controller

            setVerificationStatus('verified');

        } catch (err) {
            console.error('DID Verification failed:', err);
            setError('Verification failed. Did you cancel the signature request?');
            setVerificationStatus('failed');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatus = () => {
        switch (verificationStatus) {
            case 'verified':
                return <div className="status-box verified">✅ Identity Verified</div>;
            case 'pending':
                return <div className="status-box pending">⏳ Pending Verification...</div>;
            case 'failed':
                 return <div className="status-box failed">❌ Verification Failed</div>;
            default:
                return <div className="status-box unverified">Not Verified</div>;
        }
    };

    return (
        <div className="did-verification-container">
            <h2>Decentralized Identity (DID)</h2>
            <p>Verify your wallet address to build trust and unlock future features.</p>
            
            {renderStatus()}
            
            {verificationStatus !== 'verified' && (
                <button 
                    onClick={handleVerify} 
                    disabled={isLoading || !isConnected}
                    className="btn-verify"
                >
                    {isLoading ? 'Check Wallet...' : 'Verify with Wallet'}
                </button>
            )}

            {!isConnected && <p className="connect-prompt">Please connect your wallet to enable verification.</p>}
            {error && <div className="verification-error">{error}</div>}
        </div>
    );
};

export default DIDVerification;
