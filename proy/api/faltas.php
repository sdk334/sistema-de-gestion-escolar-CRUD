<?php

// Endpoint para gestionar inasistencias

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Crear instancia de la base de datos
$bd = new BD();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // GET: Obtener lista de inasistencias
    echo json_encode($bd->obtenerInasistencias());

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // POST: Justificar una inasistencia
    $entrada = json_decode(file_get_contents('php://input'), true);
    $idInasistencia = $entrada['id'] ?? null;
    $motivo = $entrada['reason'] ?? '';

    // Validar que se envió el ID
    if (!$idInasistencia) {
        echo json_encode(['success' => false, 'error' => 'Falta ID de inasistencia']);
        exit;
    }

    // Obtener datos de la base
    $datos = $bd->obtenerDatos();
    $encontrada = false;

    // Buscar y actualizar la inasistencia
    foreach ($datos['absences'] as &$inasistencia) {
        if ($inasistencia['id'] == $idInasistencia) {
            $inasistencia['status'] = 'Justificada';
            $inasistencia['reason'] = $motivo;
            $encontrada = true;
            break;
        }
    }

    if ($encontrada) {
        // Guardar cambios
        if ($bd->guardarDatos($datos)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Inasistencia no encontrada']);
    }

} else {
    echo json_encode(['error' => 'Método no permitido']);
}
?>
