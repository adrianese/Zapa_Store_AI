<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    protected $fillable = [
        'auction_id',
        'user_id',
        'amount_minor',
        'tx_hash',
        'signature',
        'bid_at',
    ];

    protected $casts = [
        'amount_minor' => 'integer',
        'bid_at' => 'datetime',
    ];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

