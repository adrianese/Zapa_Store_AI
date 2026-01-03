<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subject_type',
        'subject_id',
        'voter_id',
        'choice',
        'weight',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'weight' => 'integer',
    ];

    /**
     * Get the parent subject model (Auction, Dispute, etc.).
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Get the user that made the vote.
     */
    public function voter()
    {
        return $this->belongsTo(User::class, 'voter_id');
    }
}
