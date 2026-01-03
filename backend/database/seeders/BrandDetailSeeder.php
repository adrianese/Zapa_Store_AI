<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BrandDetail;

class BrandDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brandDetails = [
            [
                'marca' => 'Adedos',
                'actividad_apta' => [
                    'La marca ADEDOS redefine el confort urbano con zapatillas diseñadas para el uso diario. Su estética moderna y líneas limpias las convierten en el complemento perfecto para quienes buscan estilo sin sacrificar funcionalidad.',
                    'Ideales para caminar largas distancias o pasar todo el día en movimiento, las zapatillas ADEDOS combinan ligereza y soporte anatómico, brindando una experiencia de uso suave y sin fatiga.',
                ],
                'beneficios_materiales' => [
                    'Fabricadas con materiales sintéticos de alta calidad y mallas transpirables, las zapatillas ADEDOS ofrecen una excelente ventilación y resistencia al desgaste cotidiano.',
                    'El acabado textil antimicrobiano y los refuerzos en zonas clave aseguran durabilidad, higiene y un calce cómodo desde el primer uso.',
                ],
                'descripcion_detallada' => 'ADEDOS es una marca reconocida por su enfoque en el calzado urbano casual, combinando diseño contemporáneo con tecnologías de confort para el uso diario.',
                'is_active' => true,
            ],
            [
                'marca' => 'Niko',
                'actividad_apta' => [
                    'Las zapatillas NIKO están pensadas para corredores que exigen rendimiento y estilo. Su estructura dinámica favorece el impulso y la estabilidad en cada zancada.',
                    'La tecnología de absorción de impacto y tracción avanzada permite correr en distintos terrenos sin comprometer la seguridad ni el confort.',
                ],
                'beneficios_materiales' => [
                    'Construidas con tejidos técnicos de alta resistencia y refuerzos termosellados, las zapatillas NIKO soportan el uso exigido sin perder flexibilidad.',
                    'La entresuela con retorno de energía y la plantilla ergonómica maximizan el rendimiento en cada sesión de running.',
                ],
                'descripcion_detallada' => 'NIKO lidera el mercado de calzado deportivo de alto rendimiento, con innovaciones constantes en tecnología de amortiguación y diseño aerodinámico.',
                'is_active' => true,
            ],
            [
                'marca' => 'Under A',
                'actividad_apta' => [
                    'La marca UNDER A es sinónimo de aventura. Sus zapatillas de trekking están diseñadas para enfrentar terrenos difíciles, climas cambiantes y largas travesías.',
                    'Con una estructura robusta y suela de agarre multidireccional, ofrecen seguridad en cada paso, ya sea en montaña, bosque o senderos rocosos.',
                ],
                'beneficios_materiales' => [
                    'El cuero sintético impermeable y las costuras selladas protegen contra humedad, barro y abrasión, manteniendo el pie seco y seguro.',
                    'El interior acolchado con espuma de memoria y el sistema de ajuste reforzado garantizan comodidad prolongada y soporte estructural en caminatas exigentes.',
                ],
                'descripcion_detallada' => 'UNDER A se especializa en equipamiento outdoor de alta gama, con énfasis en durabilidad extrema y protección en condiciones adversas.',
                'is_active' => true,
            ],
            [
                'marca' => 'TorPe',
                'actividad_apta' => [
                    'La marca TorPe celebra el diseño nacional con calzado pensado para quienes valoran comodidad, conciencia ecológica y estilo funcional. Su estética sobria y moderna se adapta a cualquier rutina urbana.',
                    'Su versatilidad las convierte en aliadas tanto para actividades cotidianas como para escapadas al aire libre, manteniendo siempre una presencia estética equilibrada y responsable.',
                ],
                'beneficios_materiales' => [
                    'Confeccionadas con materiales reciclados y tejidos de bajo impacto ambiental, las zapatillas TorPe promueven una moda sustentable sin comprometer la durabilidad.',
                    'La suela de caucho expandido liviano brinda amortiguación efectiva y tracción segura, ideal para superficies urbanas y naturales.',
                    'El interior acolchado y el tejido transpirable aseguran frescura, higiene y confort prolongado, incluso en jornadas intensas.',
                ],
                'descripcion_detallada' => 'TorPe representa la nueva ola de marcas argentinas comprometidas con la sustentabilidad y el diseño consciente.',
                'is_active' => true,
            ],
            [
                'marca' => 'Puna',
                'actividad_apta' => [
                    'Puna representa la excelencia en calzado deportivo premium, fusionando diseño sofisticado con tecnología de confort. Cada par está pensado para quienes exigen lo mejor en cada paso.',
                    'Ideales para entrenamientos exigentes, caminatas prolongadas o uso diario con estilo, las zapatillas Puna ofrecen una experiencia de uso ultra liviana y anatómica.',
                ],
                'beneficios_materiales' => [
                    'Elaboradas con los mejores materiales del mercado, como tejidos técnicos de última generación y refuerzos estratégicos, las zapatillas Puna garantizan resistencia y confort superior.',
                    'El forro interno con memoria de forma y propiedades antimicrobianas ofrece un calce personalizado, fresco y libre de molestias desde el primer uso.',
                ],
                'descripcion_detallada' => 'PUNA combina herencia deportiva con innovación tecnológica, posicionándose como referente en calzado de performance y lifestyle.',
                'is_active' => true,
            ],
        ];

        foreach ($brandDetails as $detail) {
            BrandDetail::updateOrCreate(
                ['marca' => $detail['marca']],
                $detail
            );
        }

        $this->command->info('BrandDetailSeeder: ' . count($brandDetails) . ' marcas importadas correctamente.');
    }
}
