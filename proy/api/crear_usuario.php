<?php
// api/create_user.php
// Endpoint para crear nuevos usuarios

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Leer datos de entrada
    $entrada = json_decode(file_get_contents('php://input'), true);

    // Validación básica de campos requeridos
    if (!isset($entrada['username']) || !isset($entrada['password']) || !isset($entrada['role']) || !isset($entrada['name'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
        exit;
    }

    // Crear instancia de la base de datos
    $bd = new BD();
    $datos = $bd->obtenerDatos();
    $usuarios = &$datos['users'];

    // Verificar que el usuario no exista ya
    foreach ($usuarios as $usuario) {
        if ($usuario['username'] === $entrada['username']) {
            echo json_encode(['success' => false, 'error' => 'El nombre de usuario ya existe']);
            exit;
        }
        // RN-4: Verificar unicidad de boleta/ID
        if (isset($entrada['id']) && isset($usuario['id']) && $usuario['id'] === $entrada['id']) {
            echo json_encode(['success' => false, 'error' => 'El número de boleta/cuenta ya está registrado']);
            exit;
        }
        // Verificar correo electrónico único
        if (isset($entrada['email']) && isset($usuario['email']) && $usuario['email'] === $entrada['email']) {
            echo json_encode(['success' => false, 'error' => 'El correo electrónico ya está registrado']);
            exit;
        }
    }

    // Asignar ID único si no viene en la entrada
    $entrada['id'] = $entrada['id'] ?? uniqid('USR');
    $entrada['status'] = 'active'; // Estado activo por defecto

    // En producción: Hashear la contraseña
    // $entrada['password'] = password_hash($entrada['password'], PASSWORD_DEFAULT);

    // Agregar nuevo usuario al arreglo
    $usuarios[] = $entrada;

    // Guardar en la base de datos
    if ($bd->guardarDatos($datos)) {
        echo json_encode(['success' => true, 'user' => $entrada]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Error al guardar en la base de datos']);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
?>