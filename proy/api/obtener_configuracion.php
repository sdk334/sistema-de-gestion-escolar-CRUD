<?php
// Obtener configuración del sistema
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'manejador_bd.php';

$bd = new BD();
$datos = $bd->obtenerDatos();

// Retornar la configuración de settings
$settings = $datos['settings'] ?? ['enrollmentPeriod' => 'active'];
echo json_encode($settings);
