<?php

namespace App\Services;

interface AuctionSmartContractServiceInterface
{
    public function createAuction(array $auctionData);
    public function placeBid(int $auctionId, int $amount, string $userAddress);
    public function getAuctionDetails(int $auctionId);
    public function endAuction(int $auctionId);
    public function withdrawFunds(int $auctionId, string $userAddress);
}
