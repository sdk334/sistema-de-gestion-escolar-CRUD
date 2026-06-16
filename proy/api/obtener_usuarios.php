<?php
// api/get_users.php
// Endpoint para obtener la lista de usuarios

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Crear instancia de la base de datos y retornar usuarios
    $bd = new BD();
    echo json_encode($bd->obtenerUsuarios());
} else {
    // Método no soportado, retornar arreglo vacío
    echo json_encode([]);
}
?>
