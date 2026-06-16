<?php

// Endpoint para gestionar solicitudes de justificantes de estudiantes

header('Content-Type: application/json');
require_once 'manejador_bd.php';

// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Crear instancia de la base de datos
$bd = new BD();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // GET: Obtener lista de solicitudes de justificantes
    $datos = $bd->obtenerDatos();
    $solicitudes = $datos['justificationRequests'] ?? [];
    echo json_encode($solicitudes);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entrada = json_decode(file_get_contents('php://input'), true);
    $accion = $entrada['action'] ?? 'create';

    $datos = $bd->obtenerDatos();

    // Asegurar que existe el array de solicitudes
    if (!isset($datos['justificationRequests'])) {
        $datos['justificationRequests'] = [];
    }

    if ($accion === 'create') {
        // Crear nueva solicitud de justificante
        $studentId = $entrada['studentId'] ?? null;
        $studentName = $entrada['studentName'] ?? '';
        $date = $entrada['date'] ?? '';
        $subject = $entrada['subject'] ?? '';
        $reason = $entrada['reason'] ?? '';
        $level = $entrada['level'] ?? '';

        // Validaciones
        if (!$studentId || !$date || !$reason) {
            echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
            exit;
        }

        // Generar ID único
        $newId = count($datos['justificationRequests']) + 1;

        // Buscar el ID más alto existente para evitar duplicados
        foreach ($datos['justificationRequests'] as $sol) {
            if ($sol['id'] >= $newId) {
                $newId = $sol['id'] + 1;
            }
        }

        $nuevaSolicitud = [
            'id' => $newId,
            'studentId' => $studentId,
            'studentName' => $studentName,
            'date' => $date,
            'subject' => $subject,
            'reason' => $reason,
            'level' => $level,
            'status' => 'Pendiente',
            'createdAt' => date('Y-m-d H:i:s'),
            'adminResponse' => ''
        ];

        $datos['justificationRequests'][] = $nuevaSolicitud;

        if ($bd->guardarDatos($datos)) {
            echo json_encode(['success' => true, 'id' => $newId]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al guardar solicitud']);
        }

    } elseif ($accion === 'approve') {
        // Aprobar solicitud de justificante
        $idSolicitud = $entrada['id'] ?? null;
        $respuestaAdmin = $entrada['adminResponse'] ?? 'Aprobado';

        if (!$idSolicitud) {
            echo json_encode(['success' => false, 'error' => 'Falta ID de solicitud']);
            exit;
        }

        $encontrada = false;
        foreach ($datos['justificationRequests'] as &$solicitud) {
            if ($solicitud['id'] == $idSolicitud) {
                $solicitud['status'] = 'Aprobada';
                $solicitud['adminResponse'] = $respuestaAdmin;
                $solicitud['approvedAt'] = date('Y-m-d H:i:s');
                $encontrada = true;
                break;
            }
        }

        if ($encontrada) {
            if ($bd->guardarDatos($datos)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Error al guardar']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Solicitud no encontrada']);
        }

    } elseif ($accion === 'reject') {
        // Rechazar solicitud de justificante
        $idSolicitud = $entrada['id'] ?? null;
        $respuestaAdmin = $entrada['adminResponse'] ?? 'Rechazado';

        if (!$idSolicitud) {
            echo json_encode(['success' => false, 'error' => 'Falta ID de solicitud']);
            exit;
        }

        $encontrada = false;
        foreach ($datos['justificationRequests'] as &$solicitud) {
            if ($solicitud['id'] == $idSolicitud) {
                $solicitud['status'] = 'Rechazada';
                $solicitud['adminResponse'] = $respuestaAdmin;
                $solicitud['rejectedAt'] = date('Y-m-d H:i:s');
                $encontrada = true;
                break;
            }
        }

        if ($encontrada) {
            if ($bd->guardarDatos($datos)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Error al guardar']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Solicitud no encontrada']);
        }

    } else {
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    }

} else {
    echo json_encode(['error' => 'Método no permitido']);
}
?>
