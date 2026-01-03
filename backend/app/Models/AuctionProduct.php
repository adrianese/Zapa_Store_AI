<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuctionProduct extends Model
{
    protected $table = 'auction_product';
    protected $fillable = [
        'auction_id',
        'product_id',
    ];
}
