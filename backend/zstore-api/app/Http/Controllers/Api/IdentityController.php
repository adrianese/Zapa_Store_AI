<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Identity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IdentityController extends Controller
{
    /**
     * Verify a user's identity using a provided credential.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Request $request)
    {
        $validated = $request->validate([
            // In a real scenario, this would be a structured object,
            // likely a JSON-LD Verifiable Credential.
            'credential' => 'required|string',
        ]);

        $user = Auth::user();
        $credential = $validated['credential'];
        $isVerified = false;

        // --- Cryptographic Verification (Placeholder) ---
        // 1. Parse the Verifiable Credential (VC) JWT.
        //    use did-jwt, did-resolver, etc.
        //    $vc = VerifiableCredential::fromString($credential);
        //
        // 2. Resolve the issuer's DID to get their public key.
        //    $resolver = new \DIDResolver\Resolver(...);
        //    $issuerDid = $vc->getIssuer();
        //    $didDocument = $resolver->resolve($issuerDid);
        //
        // 3. Verify the JWT signature against the issuer's public key.
        //    $isSignatureValid = $vc->verify($didDocument->getPublicKey());
        //
        // 4. Check credential claims (e.g., expiry, subject DID matches user DID).
        //    if ($isSignatureValid && $vc->getSubject()->getDid() === $user->did) {
        //        $isVerified = true;
        //    }
        //
        // For this placeholder, we'll just check for a specific string.
        if ($credential === 'VALID_CREDENTIAL_STRING') {
            $isVerified = true;
        }
        // ----------------------------------------------------

        if (!$isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'Identity verification failed: Invalid credential.',
            ], 422);
        }

        $identity = Identity::updateOrCreate(
            ['user_id' => $user->id],
            [
                'did' => 'did:key:' . Str::random(32), // Placeholder DID
                'verification_level' => 'verified',
                'proofs' => json_encode(['last_vc' => Str::limit($credential, 50)]), // Store a truncated proof
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Identity verified successfully.',
            'data' => $identity,
        ]);
    }

    /**
     * Get the identity details for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $identity = Identity::where('user_id', Auth::id())->first();

        if (!$identity) {
            return response()->json([
                'success' => false,
                'message' => 'No identity record found for this user.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $identity,
        ]);
    }
}
