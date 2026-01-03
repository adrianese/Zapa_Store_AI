<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::with('sizes')->latest()->get();
        return ProductResource::collection($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'brand' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_minor' => 'required|integer|min:0',
            'currency' => 'required|string|max:3',
            'images' => 'nullable|array',
            'is_featured' => 'boolean',
            'attributes' => 'nullable|object',
            'sizes' => 'present|array', // Ensure 'sizes' is an array, can be empty
            'sizes.*.size' => 'required|string',
            'sizes.*.stock' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $validatedData = $validator->validated();
        $sizesData = $validatedData['sizes'];
        unset($validatedData['sizes']);

        $product = Product::create($validatedData);

        if (!empty($sizesData)) {
            $product->sizes()->createMany($sizesData);
        }

        $product->load('sizes');

        return new ProductResource($product);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load('sizes');
        return new ProductResource($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'brand' => 'sometimes|required|string|max:255',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'price_minor' => 'sometimes|required|integer|min:0',
            'currency' => 'sometimes|required|string|max:3',
            'images' => 'sometimes|nullable|array',
            'is_featured' => 'sometimes|boolean',
            'attributes' => 'sometimes|nullable|object',
            'sizes' => 'sometimes|array',
            'sizes.*.size' => 'required_with:sizes|string',
            'sizes.*.stock' => 'required_with:sizes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $validatedData = $validator->validated();

        if (isset($validatedData['sizes'])) {
            $sizesData = $validatedData['sizes'];
            unset($validatedData['sizes']);

            // Sync sizes: delete old ones and create new ones
            $product->sizes()->delete();
            $product->sizes()->createMany($sizesData);
        }

        $product->update($validatedData);

        $product->load('sizes');

        return new ProductResource($product);
    }

    /**
     * Update the product's sizes and stock.
     */
    public function updateSizes(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'sizes' => 'present|array',
            'sizes.*.size' => 'required|string',
            'sizes.*.stock' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $sizesData = $validator->validated()['sizes'];

        // Sync sizes: delete old ones and create new ones
        $product->sizes()->delete();
        if (!empty($sizesData)) {
            $product->sizes()->createMany($sizesData);
        }

        // Recalculate availability based on total stock
        $product->updateAvailability();

        $product->load('sizes');

        return new ProductResource($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(null, 204);
    }

    /**
     * Upload images for a product.
     */
    public function uploadImages(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $path = $request->file('image')->store('uploads/productos', 'public');

        $product->images = array_merge($product->images ?? [], [Storage::url($path)]);
        $product->save();

        return new ProductResource($product);
    }
}
