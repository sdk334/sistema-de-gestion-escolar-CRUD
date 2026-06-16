<?php
/**
 * API Endpoint para Sistema de Notificaciones (RF-13)
 * Gestión de notificaciones del sistema
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
        return ['notifications' => []];
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

if (!isset($db['notifications'])) {
    $db['notifications'] = [];
}

switch ($method) {
    case 'GET':
        $notifications = $db['notifications'];

        // Filtrar por usuario
        if (isset($_GET['userId'])) {
            $userId = $_GET['userId'];
            $notifications = array_filter($notifications, function ($n) use ($userId) {
                return $n['userId'] === $userId || $n['userId'] === 'all';
            });
            $notifications = array_values($notifications);
        }

        // Filtrar solo no leídas
        if (isset($_GET['unread']) && $_GET['unread'] === 'true') {
            $notifications = array_filter($notifications, function ($n) {
                return !$n['read'];
            });
            $notifications = array_values($notifications);
        }

        // Ordenar por fecha (más reciente primero)
        usort($notifications, function ($a, $b) {
            return strtotime($b['createdAt']) - strtotime($a['createdAt']);
        });

        echo json_encode($notifications);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'create';

        switch ($action) {
            case 'create':
                if (empty($input['title']) || empty($input['message'])) {
                    echo json_encode(['success' => false, 'error' => 'Título y mensaje son requeridos']);
                    exit;
                }

                $newNotification = [
                    'id' => uniqid('NOT'),
                    'userId' => $input['userId'] ?? 'all', // 'all' para todos los usuarios
                    'title' => $input['title'],
                    'message' => $input['message'],
                    'type' => $input['type'] ?? 'info', // info, success, warning, error
                    'link' => $input['link'] ?? null,
                    'read' => false,
                    'createdAt' => date('Y-m-d H:i:s')
                ];

                $db['notifications'][] = $newNotification;
                writeDB($dbPath, $db);

                echo json_encode(['success' => true, 'notification' => $newNotification]);
                break;

            case 'markRead':
                if (empty($input['notificationId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de notificación requerido']);
                    exit;
                }

                $found = false;
                foreach ($db['notifications'] as &$notification) {
                    if ($notification['id'] === $input['notificationId']) {
                        $notification['read'] = true;
                        $notification['readAt'] = date('Y-m-d H:i:s');
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Notificación no encontrada']);
                }
                break;

            case 'markAllRead':
                if (empty($input['userId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de usuario requerido']);
                    exit;
                }

                foreach ($db['notifications'] as &$notification) {
                    if ($notification['userId'] === $input['userId'] || $notification['userId'] === 'all') {
                        $notification['read'] = true;
                        $notification['readAt'] = date('Y-m-d H:i:s');
                    }
                }

                writeDB($dbPath, $db);
                echo json_encode(['success' => true]);
                break;

            case 'delete':
                if (empty($input['notificationId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de notificación requerido']);
                    exit;
                }

                $initialCount = count($db['notifications']);
                $db['notifications'] = array_values(array_filter($db['notifications'], function ($n) use ($input) {
                    return $n['id'] !== $input['notificationId'];
                }));

                if (count($db['notifications']) < $initialCount) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Notificación no encontrada']);
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
