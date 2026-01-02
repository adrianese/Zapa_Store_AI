<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// --- INSTRUCCIONES ---
// 1. Abre una terminal en el directorio 'backend/zstore-api'.
// 2. Ejecuta este script pasando el email del usuario como argumento.
//    Ejemplo: php assign_admin.php tu-email@ejemplo.com
// --------------------

if ($argc < 2) {
    echo "ERROR: Debes proporcionar un email como argumento.\n";
    echo "Ejemplo: php " . basename(__FILE__) . " tu-email@ejemplo.com\n";
    exit(1);
}

$email = $argv[1];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "ERROR: El email proporcionado no es válido.\n";
    exit(1);
}

$user = User::where('email', $email)->first();

if ($user) {
    echo "Usuario encontrado: " . $user->name . " (ID: " . $user->id . ")\n";
    
    $rolesActuales = $user->getRoleNames()->toArray();
    echo "Roles actuales: " . (empty($rolesActuales) ? "Ninguno" : implode(', ', $rolesActuales)) . "\n";

    // Asignar rol de 'admin' si no lo tiene
    if (!$user->hasRole('admin')) {
        $user->assignRole('admin');
        echo "=> Rol 'admin' asignado exitosamente.\n";
    } else {
        echo "=> El usuario ya tiene el rol 'admin'.\n";
    }

    // Opcional: Asignar rol 'buyer' si no lo tiene, para consistencia
    if (!$user->hasRole('buyer')) {
        $user->assignRole('buyer');
        echo "=> Rol 'buyer' asignado para consistencia.\n";
    }

    // Refrescar el usuario para obtener los roles actualizados
    $user->refresh();
    
    echo "Roles finales: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";
    echo "\n¡Proceso completado! El usuario ahora debería tener acceso de administrador.\n";

} else {
    echo "ERROR: No se encontró ningún usuario con el email '" . $email . "'.\n";
    echo "Verifica que el usuario exista en la base de datos.\n";
}
