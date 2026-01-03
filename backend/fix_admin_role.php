<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

// Asegurar que el rol admin existe
$adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

// Buscar usuario admin por email o is_admin
$admin = User::where('email', 'admin@correo.com')
    ->orWhere('is_admin', true)
    ->first();

if ($admin) {
    if (!$admin->hasRole('admin')) {
        $admin->assignRole('admin');
        echo "✓ Rol 'admin' asignado a: {$admin->email}\n";
    } else {
        echo "ℹ El usuario {$admin->email} ya tiene el rol 'admin'\n";
    }

    // Mostrar roles actuales
    echo "Roles de {$admin->email}: " . $admin->getRoleNames()->implode(', ') . "\n";
} else {
    echo "✗ No se encontró ningún usuario admin\n";
}
