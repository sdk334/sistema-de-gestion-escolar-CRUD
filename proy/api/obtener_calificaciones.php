<?php
// api/get_grades.php
// Endpoint para obtener las calificaciones

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");

// Crear instancia de la base de datos
$bd = new BD();
$datos = $bd->obtenerDatos();

// Obtener calificaciones o arreglo vacío si no existen
$calificaciones = isset($datos['grades']) ? $datos['grades'] : [];

echo json_encode($calificaciones);
?>
