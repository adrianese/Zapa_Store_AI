<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $listings = Listing::with('product.sizes')
            ->where('status', 'active')
            ->latest()
            ->get();

        return response()->json($listings);
    }

    /**
     * Display the specified resource.
     */
    public function show(Listing $listing)
    {
        // Ensure we only show active listings to the public,
        // or listings they own even if pending.
        if ($listing->status !== 'active' && optional(auth()->user())->id !== $listing->user_id) {
             abort(404);
        }

        $listing->load('product.sizes');
        return response()->json($listing);
    }

    /**
     * Store a newly created listing in storage (Phase 1).
     * The frontend calls this before interacting with the smart contract.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'price_minor' => 'required|integer|min:0',
            'currency' => 'required|string|max:3',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Optional: Check if the user is authorized to sell this product,
        // e.g., if they are the creator or have specific permissions.

        $listing = Listing::create([
            'user_id' => Auth::id(),
            'product_id' => $product->id,
            'price_minor' => $validated['price_minor'],
            'currency' => $validated['currency'],
            'status' => 'pending_creation',
        ]);

        return response()->json($listing, 201);
    }

    /**
     * Confirm a listing after on-chain transaction (Phase 2).
     * The frontend calls this after the smart contract event is received.
     */
    public function confirm(Request $request, Listing $listing)
    {
        // Ensure the authenticated user owns this listing
        if (Auth::id() !== $listing->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($listing->status !== 'pending_creation') {
            return response()->json(['message' => 'Listing not in a confirmable state'], 422);
        }

        $validated = $request->validate([
            'marketplace_item_id' => 'required|integer|unique:listings,marketplace_item_id',
            'transaction_hash' => 'required|string|unique:listings,transaction_hash',
        ]);

        $listing->update([
            'marketplace_item_id' => $validated['marketplace_item_id'],
            'transaction_hash' => $validated['transaction_hash'],
            'status' => 'active',
        ]);

        // Eager load the product relationship to return it in the response
        $listing->load('product');

        return response()->json($listing);
    }
}
