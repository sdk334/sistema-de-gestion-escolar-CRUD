<?php
// api/save_grades.php
// Endpoint para guardar calificaciones

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Leer datos de entrada
    $entrada = json_decode(file_get_contents('php://input'), true);

    // Validar que sea un arreglo válido
    if (!is_array($entrada)) {
        echo json_encode(['success' => false, 'error' => 'Formato de datos inválido']);
        exit;
    }

    // Crear instancia de la base de datos
    $bd = new BD();
    $datos = $bd->obtenerDatos();

    // Asegurar que existe el arreglo de calificaciones
    if (!isset($datos['grades'])) {
        $datos['grades'] = [];
    }

    $calificaciones = &$datos['grades'];

    // Procesar cada calificación nueva
    foreach ($entrada as $nuevaCalificacion) {
        $encontrada = false;

        // Buscar si ya existe un registro para este estudiante y materia
        foreach ($calificaciones as &$calificacionExistente) {
            if (
                $calificacionExistente['studentId'] === $nuevaCalificacion['studentId'] &&
                $calificacionExistente['subject'] === $nuevaCalificacion['subject']
            ) {
                // Actualizar calificación existente
                $calificacionExistente['p1'] = $nuevaCalificacion['p1'];
                $calificacionExistente['p2'] = $nuevaCalificacion['p2'];
                $calificacionExistente['p3'] = $nuevaCalificacion['p3'];
                $calificacionExistente['average'] = $nuevaCalificacion['average'];
                $encontrada = true;
                break;
            }
        }

        // Si no se encontró, agregar como nueva
        if (!$encontrada) {
            $calificaciones[] = $nuevaCalificacion;
        }
    }

    // Guardar en la base de datos
    if ($bd->guardarDatos($datos)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Error al guardar en base de datos']);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
?>
