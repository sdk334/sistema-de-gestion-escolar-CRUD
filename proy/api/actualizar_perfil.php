<?php

// RF-9: Endpoint para que alumnos universitarios actualicen sus datos personales

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'manejador_bd.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$phone = $input['phone'] ?? null;
$address = $input['address'] ?? null;
$alternateEmail = $input['alternateEmail'] ?? null;
$emergencyContact = $input['emergencyContact'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'ID de usuario requerido']);
    exit;
}

$bd = new BD();
$datos = $bd->obtenerDatos();

// Buscar usuario
$found = false;
foreach ($datos['users'] as &$user) {
    if ($user['id'] === $userId) {
        // RF-9: Solo alumnos universitarios pueden modificar sus datos
        if ($user['role'] !== 'alumno') {
            echo json_encode(['success' => false, 'error' => 'Solo alumnos pueden modificar su perfil']);
            exit;
        }

        // Actualizar campos permitidos (no nombre, boleta, ni rol)
        if ($phone !== null)
            $user['phone'] = $phone;
        if ($address !== null)
            $user['address'] = $address;
        if ($alternateEmail !== null)
            $user['alternateEmail'] = $alternateEmail;
        if ($emergencyContact !== null)
            $user['emergencyContact'] = $emergencyContact;

        $user['updatedAt'] = date('c');
        $found = true;
        break;
    }
}

if (!$found) {
    echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
    exit;
}

$bd->guardarDatos($datos);
echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
?>