<?php
// Cambiar estado del periodo de inscripción
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'manejador_bd.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? 'higher'; // 'basic' or 'higher'

    $bd = new BD();
    $datos = $bd->obtenerDatos();

    // Inicializar settings si no existe
    if (!isset($datos['settings'])) {
        $datos['settings'] = [
            'enrollmentPeriod' => 'active',
            'enrollmentPeriodBasic' => 'inactive'
        ];
    }

    // Asegurar que exista la llave para básico
    if (!isset($datos['settings']['enrollmentPeriodBasic'])) {
        $datos['settings']['enrollmentPeriodBasic'] = 'inactive';
    }

    // Determinar qué llave modificar
    $key = ($type === 'basic') ? 'enrollmentPeriodBasic' : 'enrollmentPeriod';
    $label = ($type === 'basic') ? 'Nivel Básico' : 'Nivel Superior';

    // Cambiar el estado
    $estadoActual = $datos['settings'][$key] ?? 'inactive';
    $nuevoEstado = ($estadoActual === 'active') ? 'inactive' : 'active';
    $datos['settings'][$key] = $nuevoEstado;

    // Guardar cambios
    if ($bd->guardarDatos($datos)) {
        echo json_encode([
            'success' => true,
            'newStatus' => $nuevoEstado,
            'type' => $type,
            'message' => "Periodo de inscripción ($label) cambiado a " . ($nuevoEstado === 'active' ? 'Abierto' : 'Cerrado')
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Error al guardar configuración']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
