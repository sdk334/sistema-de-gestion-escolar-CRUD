<?php
/**
 * API: Mantenimiento del Sistema (RN-1 Admin)
 * Panel de logs, estado de servicios y alertas
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dbPath = __DIR__ . '/../data/database.json';
$logPath = __DIR__ . '/debug_log.txt';

function leerBD()
{
    global $dbPath;
    if (!file_exists($dbPath)) {
        return ['systemLogs' => []];
    }
    $content = file_get_contents($dbPath);
    return json_decode($content, true) ?: ['systemLogs' => []];
}

function guardarBD($data)
{
    global $dbPath;
    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function agregarLog($type, $message, $details = null)
{
    global $dbPath;
    $db = leerBD();

    if (!isset($db['systemLogs'])) {
        $db['systemLogs'] = [];
    }

    $log = [
        'id' => 'LOG' . uniqid(),
        'type' => $type, // info, warning, error, security
        'message' => $message,
        'details' => $details,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    // Mantener solo los últimos 500 logs
    array_unshift($db['systemLogs'], $log);
    if (count($db['systemLogs']) > 500) {
        $db['systemLogs'] = array_slice($db['systemLogs'], 0, 500);
    }

    guardarBD($db);
    return $log;
}

$method = $_SERVER['REQUEST_METHOD'];
$db = leerBD();

if (!isset($db['systemLogs'])) {
    $db['systemLogs'] = [];
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'status';

        switch ($action) {
            case 'status':
                // Estado general del sistema
                $dbSize = file_exists($dbPath) ? filesize($dbPath) : 0;
                $logSize = file_exists($logPath) ? filesize($logPath) : 0;

                // Contar registros
                $userCount = count($db['users'] ?? []);
                $studentCount = count(array_filter($db['users'] ?? [], function ($u) {
                    return $u['role'] === 'alumno';
                }));
                $teacherCount = count(array_filter($db['users'] ?? [], function ($u) {
                    return $u['role'] === 'docente';
                }));

                // Errores recientes
                $recentErrors = array_filter($db['systemLogs'] ?? [], function ($l) {
                    return $l['type'] === 'error';
                });
                $recentErrors = array_slice($recentErrors, 0, 5);

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'status' => 'online',
                        'serverTime' => date('Y-m-d H:i:s'),
                        'phpVersion' => phpversion(),
                        'database' => [
                            'path' => $dbPath,
                            'size' => round($dbSize / 1024, 2) . ' KB',
                            'writable' => is_writable($dbPath)
                        ],
                        'statistics' => [
                            'totalUsers' => $userCount,
                            'students' => $studentCount,
                            'teachers' => $teacherCount,
                            'enrollments' => count($db['enrollments'] ?? []),
                            'incidents' => count($db['incidents'] ?? []),
                            'subjects' => count($db['subjects'] ?? [])
                        ],
                        'recentErrors' => $recentErrors,
                        'logCount' => count($db['systemLogs'] ?? [])
                    ]
                ]);
                break;

            case 'logs':
                // Obtener logs del sistema
                $type = $_GET['type'] ?? null;
                $limit = min((int) ($_GET['limit'] ?? 50), 200);

                $logs = $db['systemLogs'] ?? [];

                if ($type) {
                    $logs = array_filter($logs, function ($l) use ($type) {
                        return $l['type'] === $type;
                    });
                }

                echo json_encode([
                    'success' => true,
                    'data' => array_slice(array_values($logs), 0, $limit),
                    'total' => count($logs)
                ]);
                break;

            case 'debugLog':
                // Leer archivo de log de debug
                if (file_exists($logPath)) {
                    $content = file_get_contents($logPath);
                    $lines = explode("\n", $content);
                    $lines = array_slice($lines, -100); // Últimas 100 líneas
                    echo json_encode([
                        'success' => true,
                        'data' => implode("\n", $lines),
                        'size' => filesize($logPath)
                    ]);
                } else {
                    echo json_encode(['success' => true, 'data' => 'No hay logs de debug']);
                }
                break;

            case 'health':
                // Health check rápido
                $checks = [
                    'database' => file_exists($dbPath) && is_writable($dbPath),
                    'apiFolder' => is_writable(__DIR__),
                    'php' => version_compare(PHP_VERSION, '7.0.0', '>='),
                    'json' => function_exists('json_encode')
                ];

                $allOk = !in_array(false, $checks, true);

                echo json_encode([
                    'success' => true,
                    'healthy' => $allOk,
                    'checks' => $checks
                ]);
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';

        switch ($action) {
            case 'log':
                // Agregar log manualmente
                $type = $input['type'] ?? 'info';
                $message = $input['message'] ?? '';
                $details = $input['details'] ?? null;

                if (empty($message)) {
                    echo json_encode(['success' => false, 'error' => 'Mensaje requerido']);
                    exit;
                }

                $log = agregarLog($type, $message, $details);
                echo json_encode(['success' => true, 'log' => $log]);
                break;

            case 'clearLogs':
                // Limpiar logs (solo tipo específico o todos)
                $type = $input['type'] ?? null;

                if ($type) {
                    $db['systemLogs'] = array_filter($db['systemLogs'] ?? [], function ($l) use ($type) {
                        return $l['type'] !== $type;
                    });
                    $db['systemLogs'] = array_values($db['systemLogs']);
                } else {
                    $db['systemLogs'] = [];
                }

                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Logs limpiados']);
                break;

            case 'clearDebugLog':
                // Limpiar archivo de debug
                if (file_exists($logPath)) {
                    file_put_contents($logPath, '');
                }
                echo json_encode(['success' => true, 'message' => 'Log de debug limpiado']);
                break;

            case 'backup':
                // Crear backup de la base de datos
                $backupPath = __DIR__ . '/../data/backup_' . date('Y-m-d_H-i-s') . '.json';
                if (copy($dbPath, $backupPath)) {
                    agregarLog('info', 'Backup creado', ['path' => $backupPath]);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Backup creado',
                        'path' => $backupPath
                    ]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Error al crear backup']);
                }
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no permitido']);
}
?>