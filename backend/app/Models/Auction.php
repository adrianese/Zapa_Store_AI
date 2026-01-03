<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Auction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'start_at',
        'end_at',
        'reserve_price_minor',
        'starting_bid_minor',
        'current_bid_minor',
        'winner_id',
        'status',
        'rules',
    ];

    protected $casts = [
        'rules' => 'array',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'reserve_price_minor' => 'integer',
        'starting_bid_minor' => 'integer',
        'current_bid_minor' => 'integer',
    ];


    // Relación 1:1 con producto
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class)->orderBy('bid_at', 'desc');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_id');
    }
}

