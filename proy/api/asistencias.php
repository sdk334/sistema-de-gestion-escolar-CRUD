<?php
/**
 * API Endpoint para Registro de Asistencia (RF-5)
 * Gestión de asistencia diaria de alumnos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dbPath = __DIR__ . '/../data/database.json';

function readDB($path)
{
    if (!file_exists($path)) {
        return ['attendance' => []];
    }
    $content = file_get_contents($path);
    return json_decode($content, true);
}

function writeDB($path, $data)
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = readDB($dbPath);

if (!isset($db['attendance'])) {
    $db['attendance'] = [];
}

switch ($method) {
    case 'GET':
        $attendance = $db['attendance'];

        // Filtrar por fecha
        if (isset($_GET['date'])) {
            $date = $_GET['date'];
            $attendance = array_filter($attendance, function ($a) use ($date) {
                return $a['date'] === $date;
            });
            $attendance = array_values($attendance);
        }

        // Filtrar por grupo
        if (isset($_GET['groupId'])) {
            $groupId = $_GET['groupId'];
            $attendance = array_filter($attendance, function ($a) use ($groupId) {
                return $a['groupId'] === $groupId;
            });
            $attendance = array_values($attendance);
        }

        // Filtrar por alumno
        if (isset($_GET['studentId'])) {
            $studentId = $_GET['studentId'];
            $attendance = array_filter($attendance, function ($a) use ($studentId) {
                return $a['studentId'] === $studentId;
            });
            $attendance = array_values($attendance);
        }

        // Filtrar por docente
        if (isset($_GET['teacherId'])) {
            $teacherId = $_GET['teacherId'];
            $attendance = array_filter($attendance, function ($a) use ($teacherId) {
                return $a['teacherId'] === $teacherId;
            });
            $attendance = array_values($attendance);
        }

        echo json_encode($attendance);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'register';

        switch ($action) {
            case 'register':
                // Registrar asistencia para un grupo completo
                if (empty($input['groupId']) || empty($input['date']) || empty($input['records'])) {
                    echo json_encode(['success' => false, 'error' => 'Grupo, fecha y registros son requeridos']);
                    exit;
                }

                $date = $input['date'];
                $groupId = $input['groupId'];
                $teacherId = $input['teacherId'] ?? '';
                $records = $input['records']; // Array de {studentId, studentName, status, notes}

                // Eliminar registros anteriores del mismo grupo y fecha
                $db['attendance'] = array_values(array_filter($db['attendance'], function ($a) use ($groupId, $date) {
                    return !($a['groupId'] === $groupId && $a['date'] === $date);
                }));

                // Agregar nuevos registros
                foreach ($records as $record) {
                    $db['attendance'][] = [
                        'date' => $date,
                        'groupId' => $groupId,
                        'studentId' => $record['studentId'],
                        'studentName' => $record['studentName'] ?? '',
                        'status' => $record['status'], // 'Presente', 'Ausente', 'Tardanza', 'Justificado'
                        'notes' => $record['notes'] ?? '',
                        'teacherId' => $teacherId,
                        'createdAt' => date('Y-m-d H:i:s')
                    ];
                }

                writeDB($dbPath, $db);
                echo json_encode(['success' => true, 'message' => 'Asistencia registrada correctamente']);
                break;

            case 'updateSingle':
                // Actualizar un registro individual
                if (empty($input['date']) || empty($input['studentId']) || empty($input['groupId'])) {
                    echo json_encode(['success' => false, 'error' => 'Fecha, alumno y grupo son requeridos']);
                    exit;
                }

                $found = false;
                foreach ($db['attendance'] as &$record) {
                    if (
                        $record['date'] === $input['date'] &&
                        $record['studentId'] === $input['studentId'] &&
                        $record['groupId'] === $input['groupId']
                    ) {
                        if (isset($input['status']))
                            $record['status'] = $input['status'];
                        if (isset($input['notes']))
                            $record['notes'] = $input['notes'];
                        $record['updatedAt'] = date('Y-m-d H:i:s');
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Registro no encontrado']);
                }
                break;

            case 'getStats':
                // Obtener estadísticas de asistencia
                $groupId = $input['groupId'] ?? null;
                $studentId = $input['studentId'] ?? null;
                $startDate = $input['startDate'] ?? null;
                $endDate = $input['endDate'] ?? null;

                $filtered = $db['attendance'];

                if ($groupId) {
                    $filtered = array_filter($filtered, function ($a) use ($groupId) {
                        return $a['groupId'] === $groupId;
                    });
                }

                if ($studentId) {
                    $filtered = array_filter($filtered, function ($a) use ($studentId) {
                        return $a['studentId'] === $studentId;
                    });
                }

                if ($startDate) {
                    $filtered = array_filter($filtered, function ($a) use ($startDate) {
                        return $a['date'] >= $startDate;
                    });
                }

                if ($endDate) {
                    $filtered = array_filter($filtered, function ($a) use ($endDate) {
                        return $a['date'] <= $endDate;
                    });
                }

                $stats = [
                    'total' => count($filtered),
                    'presente' => 0,
                    'ausente' => 0,
                    'tardanza' => 0,
                    'justificado' => 0
                ];

                foreach ($filtered as $record) {
                    $status = strtolower($record['status']);
                    if (isset($stats[$status])) {
                        $stats[$status]++;
                    }
                }

                $stats['porcentajeAsistencia'] = $stats['total'] > 0
                    ? round(($stats['presente'] + $stats['tardanza'] + $stats['justificado']) / $stats['total'] * 100, 1)
                    : 0;

                echo json_encode($stats);
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no permitido']);
}
?>
