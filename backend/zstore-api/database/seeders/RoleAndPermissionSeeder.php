<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'create products']);
        Permission::create(['name' => 'edit products']);
        Permission::create(['name' => 'delete products']);
        Permission::create(['name' => 'view products']);

        Permission::create(['name' => 'create auctions']);
        Permission::create(['name' => 'edit auctions']);
        Permission::create(['name' => 'delete auctions']);
        Permission::create(['name' => 'view auctions']);

        Permission::create(['name' => 'view users']);
        Permission::create(['name' => 'edit users']);
        Permission::create(['name' => 'delete users']);

        // create roles and assign created permissions

        // this can be done as separate statements
        $role = Role::create(['name' => 'seller']);
        $role->givePermissionTo(['create products', 'edit products', 'view products']);

        $role = Role::create(['name' => 'buyer']);
        $role->givePermissionTo(['view products', 'view auctions']);

        // or may be done by chaining
        $role = Role::create(['name' => 'admin']);
        $role->givePermissionTo(Permission::all());
    }
}
