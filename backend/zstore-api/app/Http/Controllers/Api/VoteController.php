<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class VoteController extends Controller
{
    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_type' => ['required', 'string', 'in:App\\Models\\Auction,App\\Models\\Dispute'], // Example types
            'subject_id' => ['required', 'integer'],
            'choice' => ['required', 'string', 'max:255'],
            'weight' => ['sometimes', 'integer', 'min:1'],
        ]);

        // Basic check for existence of the subject
        if (!class_exists($validated['subject_type']) || !\App\Models\Auction::find($validated['subject_id'])) {
             return response()->json([
                'success' => false,
                'message' => 'The selected subject is invalid.',
            ], 422);
        }

        $vote = Vote::create([
            'voter_id' => Auth::id(),
            'subject_type' => $validated['subject_type'],
            'subject_id' => $validated['subject_id'],
            'choice' => $validated['choice'],
            'weight' => $validated['weight'] ?? 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => $vote,
            'message' => 'Vote cast successfully.',
        ], 201);
    }
}
