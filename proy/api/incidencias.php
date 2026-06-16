<?php
/**
 * API de Gestión de Incidencias (RF-3, RF-7)
 * Endpoints para crear, listar y gestionar incidencias de conducta, retardos y faltas
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Ruta al archivo de base de datos
$dbPath = __DIR__ . '/../data/database.json';

// Función para leer la base de datos
function readDatabase($path)
{
    if (!file_exists($path)) {
        return ['incidencias' => []];
    }
    $content = file_get_contents($path);
    return json_decode($content, true) ?: ['incidencias' => []];
}

// Función para escribir en la base de datos
function writeDatabase($path, $data)
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Generar ID único para incidencia
function generateIncidentId()
{
    return 'INC' . uniqid();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener incidencias
    $db = readDatabase($dbPath);
    $incidencias = $db['incidencias'] ?? [];

    // Filtrar por parámetros si existen
    if (isset($_GET['studentId'])) {
        $incidencias = array_filter($incidencias, fn($i) => $i['studentId'] === $_GET['studentId']);
    }
    if (isset($_GET['teacherId'])) {
        $incidencias = array_filter($incidencias, fn($i) => $i['teacherId'] === $_GET['teacherId']);
    }
    if (isset($_GET['type'])) {
        $incidencias = array_filter($incidencias, fn($i) => $i['type'] === $_GET['type']);
    }
    if (isset($_GET['status'])) {
        $incidencias = array_filter($incidencias, fn($i) => $i['status'] === $_GET['status']);
    }
    if (isset($_GET['level'])) {
        $incidencias = array_filter($incidencias, fn($i) => $i['level'] === $_GET['level']);
    }

    echo json_encode(array_values($incidencias));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    $db = readDatabase($dbPath);
    if (!isset($db['incidencias'])) {
        $db['incidencias'] = [];
    }

    switch ($action) {
        case 'create':
            // RF-7: Crear nueva incidencia (Docente)
            $newIncident = [
                'id' => generateIncidentId(),
                'studentId' => $input['studentId'] ?? '',
                'studentName' => $input['studentName'] ?? '',
                'teacherId' => $input['teacherId'] ?? '',
                'teacherName' => $input['teacherName'] ?? '',
                'type' => $input['type'] ?? 'conducta', // conducta, retardo, falta
                'description' => $input['description'] ?? '',
                'date' => $input['date'] ?? date('Y-m-d'),
                'time' => $input['time'] ?? date('H:i'),
                'severity' => $input['severity'] ?? 'leve', // leve, moderada, grave
                'level' => $input['level'] ?? '',
                'groupId' => $input['groupId'] ?? '',
                'status' => 'pendiente', // pendiente, revisada, sancionada
                'sanction' => null,
                'adminResponse' => '',
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => null
            ];

            $db['incidencias'][] = $newIncident;
            writeDatabase($dbPath, $db);

            echo json_encode([
                'success' => true,
                'message' => 'Incidencia registrada exitosamente',
                'incident' => $newIncident
            ]);
            break;

        case 'update':
            // Actualizar incidencia
            $incidentId = $input['id'] ?? '';
            $updated = false;

            foreach ($db['incidencias'] as &$incident) {
                if ($incident['id'] === $incidentId) {
                    if (isset($input['status']))
                        $incident['status'] = $input['status'];
                    if (isset($input['severity']))
                        $incident['severity'] = $input['severity'];
                    if (isset($input['description']))
                        $incident['description'] = $input['description'];
                    if (isset($input['adminResponse']))
                        $incident['adminResponse'] = $input['adminResponse'];
                    if (isset($input['sanction']))
                        $incident['sanction'] = $input['sanction'];
                    $incident['updatedAt'] = date('Y-m-d H:i:s');
                    $updated = true;
                    break;
                }
            }

            if ($updated) {
                writeDatabase($dbPath, $db);
                echo json_encode(['success' => true, 'message' => 'Incidencia actualizada']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Incidencia no encontrada']);
            }
            break;

        case 'review':
            // RF-3: Admin revisa incidencia
            $incidentId = $input['id'] ?? '';
            $adminResponse = $input['adminResponse'] ?? '';
            $status = $input['status'] ?? 'revisada';

            foreach ($db['incidencias'] as &$incident) {
                if ($incident['id'] === $incidentId) {
                    $incident['status'] = $status;
                    $incident['adminResponse'] = $adminResponse;
                    $incident['updatedAt'] = date('Y-m-d H:i:s');

                    writeDatabase($dbPath, $db);
                    echo json_encode(['success' => true, 'message' => 'Incidencia revisada']);
                    exit;
                }
            }

            echo json_encode(['success' => false, 'error' => 'Incidencia no encontrada']);
            break;

        case 'applySanction':
            // RF-3: Aplicar sanción
            $incidentId = $input['id'] ?? '';
            $sanction = [
                'type' => $input['sanctionType'] ?? 'suspension',
                'description' => $input['sanctionDescription'] ?? '',
                'duration' => $input['sanctionDuration'] ?? null,
                'appliedAt' => date('Y-m-d H:i:s'),
                'appliedBy' => $input['adminId'] ?? ''
            ];

            foreach ($db['incidencias'] as &$incident) {
                if ($incident['id'] === $incidentId) {
                    $incident['status'] = 'sancionada';
                    $incident['sanction'] = $sanction;
                    $incident['updatedAt'] = date('Y-m-d H:i:s');

                    writeDatabase($dbPath, $db);
                    echo json_encode(['success' => true, 'message' => 'Sanción aplicada']);
                    exit;
                }
            }

            echo json_encode(['success' => false, 'error' => 'Incidencia no encontrada']);
            break;

        case 'delete':
            // Eliminar incidencia
            $incidentId = $input['id'] ?? '';
            $initialCount = count($db['incidencias']);

            $db['incidencias'] = array_values(array_filter(
                $db['incidencias'],
                fn($i) => $i['id'] !== $incidentId
            ));

            if (count($db['incidencias']) < $initialCount) {
                writeDatabase($dbPath, $db);
                echo json_encode(['success' => true, 'message' => 'Incidencia eliminada']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Incidencia no encontrada']);
            }
            break;

        case 'getStats':
            // Obtener estadísticas
            $studentId = $input['studentId'] ?? null;
            $level = $input['level'] ?? null;

            $filtered = $db['incidencias'];
            if ($studentId) {
                $filtered = array_filter($filtered, fn($i) => $i['studentId'] === $studentId);
            }
            if ($level) {
                $filtered = array_filter($filtered, fn($i) => $i['level'] === $level);
            }

            $stats = [
                'total' => count($filtered),
                'conducta' => count(array_filter($filtered, fn($i) => $i['type'] === 'conducta')),
                'retardo' => count(array_filter($filtered, fn($i) => $i['type'] === 'retardo')),
                'falta' => count(array_filter($filtered, fn($i) => $i['type'] === 'falta')),
                'pendientes' => count(array_filter($filtered, fn($i) => $i['status'] === 'pendiente')),
                'sancionadas' => count(array_filter($filtered, fn($i) => $i['status'] === 'sancionada'))
            ];

            echo json_encode($stats);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    }
    exit;
}

echo json_encode(['error' => 'Método no permitido']);
