<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MockAuctionSmartContractService implements AuctionSmartContractServiceInterface
{
    public function createAuction(array $auctionData)
    {
        Log::info('Mocking auction creation on blockchain', $auctionData);
        return ['transaction_hash' => '0x' . bin2hex(random_bytes(32)), 'contract_address' => '0x' . bin2hex(random_bytes(20))];
    }

    public function placeBid(int $auctionId, int $amount, string $userAddress)
    {
        Log::info("Mocking bid placement on blockchain for auction {$auctionId}", ['amount' => $amount, 'user' => $userAddress]);
        return ['transaction_hash' => '0x' . bin2hex(random_bytes(32))];
    }

    public function getAuctionDetails(int $auctionId)
    {
        Log::info("Mocking getting auction details from blockchain for auction {$auctionId}");
        return [
            'highest_bid' => rand(100, 1000),
            'highest_bidder' => '0x' . bin2hex(random_bytes(20)),
            'is_active' => true,
        ];
    }

    public function endAuction(int $auctionId)
    {
        Log::info("Mocking ending auction on blockchain for auction {$auctionId}");
        return ['transaction_hash' => '0x' . bin2hex(random_bytes(32))];
    }

    public function withdrawFunds(int $auctionId, string $userAddress)
    {
        Log::info("Mocking withdrawing funds from blockchain for auction {$auctionId}", ['user' => $userAddress]);
        return ['transaction_hash' => '0x' . bin2hex(random_bytes(32))];
    }
}
