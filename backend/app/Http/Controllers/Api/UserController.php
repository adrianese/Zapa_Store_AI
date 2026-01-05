<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    // Listar todos los usuarios (solo admin)
    public function index(Request $request)
    {
        // Gate::authorize('admin');
        $users = User::with('roles')->paginate(20);
        return response()->json($users);
    }

    // Mostrar detalle de usuario
    public function show($id)
    {
        // Gate::authorize('admin');
        $user = User::with('roles')->findOrFail($id);
        return response()->json($user);
    }

    // Actualizar usuario
    public function update(Request $request, $id)
    {
        // Gate::authorize('admin');
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|array',
        ]);
        $user->update($validated);
        return response()->json(['message' => 'Usuario actualizado', 'user' => $user->fresh()]);
    }

    // Eliminar usuario
    public function destroy($id)
    {
        // Gate::authorize('admin');
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Usuario eliminado']);
    }

    // Asignar rol a usuario
    public function assignRole(Request $request, $id)
    {
        // Gate::authorize('admin');
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'role' => 'required|string',
        ]);
        $user->syncRoles([$validated['role']]);
        return response()->json(['message' => 'Rol asignado', 'roles' => $user->getRoleNames()]);
    }
}
