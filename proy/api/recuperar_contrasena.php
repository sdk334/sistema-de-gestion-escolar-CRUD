<?php
// api/recuperar_contrasena.php
// RF-13: Recuperación real de contraseña con tokens temporales

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
$action = $input['action'] ?? 'request';

$bd = new BD();
$datos = $bd->obtenerDatos();

switch ($action) {
    case 'request':
        // Solicitar token de recuperación
        $email = $input['email'] ?? null;

        if (!$email) {
            echo json_encode(['success' => false, 'error' => 'Email requerido']);
            exit;
        }

        // Buscar usuario por email
        $found = false;
        foreach ($datos['users'] as &$user) {
            if ($user['email'] === $email) {
                // Generar token único
                $token = bin2hex(random_bytes(32));
                $expiration = date('c', strtotime('+15 minutes'));

                $user['resetToken'] = $token;
                $user['resetTokenExpires'] = $expiration;

                $bd->guardarDatos($datos);

                // En producción, enviarías un email aquí
                // Por ahora, devolvemos el token para pruebas
                echo json_encode([
                    'success' => true,
                    'message' => 'Token de recuperación generado',
                    'token' => $token, // Solo para desarrollo
                    'expiresAt' => $expiration,
                    'recoveryUrl' => "http://localhost/proy/?reset=$token"
                ]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            // Por seguridad, no revelamos si el email existe
            echo json_encode(['success' => true, 'message' => 'Si el email existe, recibirá instrucciones']);
        }
        break;

    case 'validate':
        // Validar que el token sea válido
        $token = $input['token'] ?? null;

        if (!$token) {
            echo json_encode(['success' => false, 'error' => 'Token requerido']);
            exit;
        }

        foreach ($datos['users'] as $user) {
            if (isset($user['resetToken']) && $user['resetToken'] === $token) {
                if (strtotime($user['resetTokenExpires']) > time()) {
                    echo json_encode(['success' => true, 'valid' => true, 'userId' => $user['id']]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Token expirado']);
                }
                exit;
            }
        }

        echo json_encode(['success' => false, 'error' => 'Token inválido']);
        break;

    case 'reset':
        // Cambiar contraseña con token válido
        $token = $input['token'] ?? null;
        $newPassword = $input['newPassword'] ?? null;

        if (!$token || !$newPassword) {
            echo json_encode(['success' => false, 'error' => 'Token y nueva contraseña requeridos']);
            exit;
        }

        // RN-8: Validar complejidad de contraseña
        if (strlen($newPassword) < 9) {
            echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 9 caracteres']);
            exit;
        }

        if (
            !preg_match('/[a-z]/', $newPassword) ||
            !preg_match('/[A-Z]/', $newPassword) ||
            !preg_match('/[0-9]/', $newPassword) ||
            !preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $newPassword)
        ) {
            echo json_encode(['success' => false, 'error' => 'La contraseña debe tener mayúscula, minúscula, número y símbolo']);
            exit;
        }

        foreach ($datos['users'] as &$user) {
            if (isset($user['resetToken']) && $user['resetToken'] === $token) {
                if (strtotime($user['resetTokenExpires']) <= time()) {
                    echo json_encode(['success' => false, 'error' => 'Token expirado']);
                    exit;
                }

                // Cambiar contraseña y limpiar token
                $user['password'] = $newPassword; // En producción: usar hash
                unset($user['resetToken']);
                unset($user['resetTokenExpires']);
                $user['failedAttempts'] = 0;
                $user['lockoutUntil'] = 0;

                $bd->guardarDatos($datos);
                echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
                exit;
            }
        }

        echo json_encode(['success' => false, 'error' => 'Token inválido']);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
}
?>