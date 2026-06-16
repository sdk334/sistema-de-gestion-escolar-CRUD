<?php

// Endpoint para actualizar o eliminar usuarios

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");

// Manejar solicitudes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Leer datos de entrada
$entrada = json_decode(file_get_contents('php://input'), true);
$accion = $entrada['action'] ?? '';
$idUsuario = $entrada['userId'] ?? '';

if (!$idUsuario) {
    echo json_encode(['success' => false, 'error' => 'ID de usuario requerido']);
    exit;
}

// Crear instancia de la base de datos
$bd = new BD();
$datos = $bd->obtenerDatos();
$usuarios = &$datos['users'];

// Buscar usuario por ID
$indiceUsuario = -1;
foreach ($usuarios as $indice => $usuario) {
    if ($usuario['id'] === $idUsuario) {
        $indiceUsuario = $indice;
        break;
    }
}

if ($indiceUsuario === -1) {
    echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
    exit;
}

// Protección: No permitir modificar ni eliminar administradores
if ($usuarios[$indiceUsuario]['role'] === 'admin') {
    echo json_encode(['success' => false, 'error' => 'No se puede modificar ni eliminar al administrador']);
    exit;
}

// Ejecutar acción según el tipo
switch ($accion) {
    case 'toggle_status':
        // Cambiar entre activo/inactivo
        $estadoActual = $usuarios[$indiceUsuario]['status'] ?? 'active';
        $nuevoEstado = ($estadoActual === 'active') ? 'inactive' : 'active';
        $usuarios[$indiceUsuario]['status'] = $nuevoEstado;

        if ($bd->guardarDatos($datos)) {
            echo json_encode(['success' => true, 'newStatus' => $nuevoEstado]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar']);
        }
        break;

    case 'delete':
        // Eliminar usuario del arreglo - usar unset y reindexar
        unset($datos['users'][$indiceUsuario]);
        $datos['users'] = array_values($datos['users']); // Reindexar

        if ($bd->guardarDatos($datos)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar']);
        }
        break;

    // RN-5: Baja Temporal (conserva boleta)
    case 'temporary_leave':
        // Solo aplicable a alumnos
        if ($usuarios[$indiceUsuario]['role'] !== 'alumno') {
            echo json_encode(['success' => false, 'error' => 'La baja temporal solo aplica a alumnos']);
            exit;
        }

        $usuarios[$indiceUsuario]['status'] = 'baja_temporal';
        $usuarios[$indiceUsuario]['temporaryLeaveDate'] = date('Y-m-d H:i:s');
        // RN-5: La boleta (username) se conserva intacta

        if ($bd->guardarDatos($datos)) {
            echo json_encode([
                'success' => true,
                'newStatus' => 'baja_temporal',
                'message' => 'Baja temporal registrada. La boleta ha sido conservada (RN-5).',
                'boleta' => $usuarios[$indiceUsuario]['username']
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar']);
        }
        break;

    // RN-5: Reincorporación (mismo número de boleta)
    case 'reincorporate':
        if ($usuarios[$indiceUsuario]['status'] !== 'baja_temporal') {
            echo json_encode(['success' => false, 'error' => 'El usuario no está en baja temporal']);
            exit;
        }

        $usuarios[$indiceUsuario]['status'] = 'active';
        $usuarios[$indiceUsuario]['reincorporationDate'] = date('Y-m-d H:i:s');
        // RN-5: Se conserva el mismo número de boleta

        if ($bd->guardarDatos($datos)) {
            echo json_encode([
                'success' => true,
                'newStatus' => 'active',
                'message' => 'Usuario reincorporado exitosamente con la misma boleta.',
                'boleta' => $usuarios[$indiceUsuario]['username']
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
}
?>