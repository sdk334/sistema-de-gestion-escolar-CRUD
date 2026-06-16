<?php
// api/login.php
// Endpoint para inicio de sesión de usuarios

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Leer datos de entrada
    $entrada = json_decode(file_get_contents('php://input'), true);

    $nombreUsuario = $entrada['username'] ?? '';
    $contrasena = $entrada['password'] ?? '';

    // Crear instancia de la base de datos
    $bd = new BD();
    $datos = $bd->obtenerDatos();
    $usuarios = &$datos['users']; // Referencia para modificar el arreglo

    $encontrado = false;
    $usuarioEncontrado = null;
    $indiceUsuario = -1;

    // Buscar usuario por nombre de usuario o correo
    foreach ($usuarios as $indice => $usuario) {
        if ($usuario['username'] === $nombreUsuario || (isset($usuario['email']) && $usuario['email'] === $nombreUsuario)) {
            $indiceUsuario = $indice;
            $usuarioEncontrado = $usuario;
            $encontrado = true;
            break;
        }
    }

    // Si no se encontró el usuario
    if (!$encontrado) {
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
        exit;
    }

    // RN-9: Verificar si la cuenta está bloqueada
    if (isset($usuarioEncontrado['lockoutUntil'])) {
        if (time() < $usuarioEncontrado['lockoutUntil']) {
            $minutosRestantes = ceil(($usuarioEncontrado['lockoutUntil'] - time()) / 60);
            echo json_encode(['success' => false, 'error' => "Cuenta bloqueada. Intente de nuevo en {$minutosRestantes} minutos."]);
            exit;
        } else {
            // El bloqueo expiró, reiniciar contadores
            $usuarios[$indiceUsuario]['lockoutUntil'] = 0;
            $usuarios[$indiceUsuario]['failedAttempts'] = 0;
        }
    }

    // Validar contraseña
    if ($usuarioEncontrado['password'] === $contrasena) {
        // Verificar que la cuenta esté activa
        if ($usuarioEncontrado['status'] !== 'active') {
            echo json_encode(['success' => false, 'error' => 'E42 - Cuenta inactiva']);
            exit;
        }

        // Éxito: Reiniciar intentos fallidos
        $usuarios[$indiceUsuario]['failedAttempts'] = 0;
        $usuarios[$indiceUsuario]['lockoutUntil'] = 0;
        $bd->guardarDatos($datos);

        // Seguridad: Eliminar contraseña antes de enviar respuesta
        unset($usuarioEncontrado['password']);
        echo json_encode(['success' => true, 'user' => $usuarioEncontrado]);
    } else {
        // Fallo: Incrementar intentos fallidos
        $intentos = ($usuarioEncontrado['failedAttempts'] ?? 0) + 1;
        $usuarios[$indiceUsuario]['failedAttempts'] = $intentos;

        $mensajeError = 'Contraseña incorrecta';

        // RN-9: Bloquear cuenta después de 3 intentos fallidos
        if ($intentos >= 3) {
            $usuarios[$indiceUsuario]['lockoutUntil'] = time() + (3 * 60); // 3 minutos
            $mensajeError = 'Has excedido los intentos. Cuenta bloqueada por 3 minutos.';
        }

        $bd->guardarDatos($datos);
        echo json_encode(['success' => false, 'error' => $mensajeError, 'attempts' => $intentos]);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
?>
