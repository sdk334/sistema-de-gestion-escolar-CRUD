<?php
/**
 * API: Gestión de Talleres y Optativas (RF-2)
 * Permite crear, listar, habilitar/deshabilitar talleres
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dbPath = __DIR__ . '/../data/database.json';

function leerBD()
{
    global $dbPath;
    if (!file_exists($dbPath)) {
        return ['workshops' => []];
    }
    $content = file_get_contents($dbPath);
    return json_decode($content, true) ?: ['workshops' => []];
}

function guardarBD($data)
{
    global $dbPath;
    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = leerBD();

if (!isset($db['workshops'])) {
    $db['workshops'] = [];
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';

        switch ($action) {
            case 'list':
                // Listar todos los talleres
                $level = $_GET['level'] ?? null;
                $workshops = $db['workshops'];

                if ($level) {
                    $workshops = array_filter($workshops, function ($w) use ($level) {
                        return $w['level'] === $level;
                    });
                }

                echo json_encode([
                    'success' => true,
                    'data' => array_values($workshops)
                ]);
                break;

            case 'available':
                // Solo talleres habilitados
                $workshops = array_filter($db['workshops'], function ($w) {
                    return $w['status'] === 'active';
                });
                echo json_encode([
                    'success' => true,
                    'data' => array_values($workshops)
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
            case 'create':
                // RF-2: Crear nuevo taller/optativa
                if (empty($input['name']) || empty($input['level'])) {
                    echo json_encode(['success' => false, 'error' => 'Nombre y nivel son requeridos']);
                    exit;
                }

                $newWorkshop = [
                    'id' => 'WKS' . uniqid(),
                    'name' => $input['name'],
                    'description' => $input['description'] ?? '',
                    'level' => $input['level'],
                    'type' => $input['type'] ?? 'taller', // taller u optativa
                    'credits' => $input['credits'] ?? 4,
                    'capacity' => $input['capacity'] ?? 30,
                    'enrolled' => 0,
                    'teacherId' => $input['teacherId'] ?? null,
                    'schedule' => $input['schedule'] ?? '',
                    'status' => 'pending', // pending, active, inactive
                    'createdAt' => date('Y-m-d H:i:s')
                ];

                $db['workshops'][] = $newWorkshop;
                guardarBD($db);

                echo json_encode([
                    'success' => true,
                    'message' => 'Taller creado correctamente',
                    'workshop' => $newWorkshop
                ]);
                break;

            case 'toggle':
                // RF-2: Habilitar/deshabilitar taller
                $workshopId = $input['workshopId'] ?? '';

                if (empty($workshopId)) {
                    echo json_encode(['success' => false, 'error' => 'ID de taller requerido']);
                    exit;
                }

                $found = false;
                $newStatus = '';
                foreach ($db['workshops'] as &$w) {
                    if ($w['id'] === $workshopId) {
                        // Cambiar estado: pending->active, active->inactive, inactive->active
                        if ($w['status'] === 'pending' || $w['status'] === 'inactive') {
                            $w['status'] = 'active';
                        } else {
                            $w['status'] = 'inactive';
                        }
                        $newStatus = $w['status'];
                        $w['updatedAt'] = date('Y-m-d H:i:s');
                        $found = true;
                        break;
                    }
                }

                if (!$found) {
                    echo json_encode(['success' => false, 'error' => 'Taller no encontrado']);
                    exit;
                }

                guardarBD($db);
                echo json_encode([
                    'success' => true,
                    'newStatus' => $newStatus,
                    'message' => $newStatus === 'active' ? 'Taller habilitado' : 'Taller deshabilitado'
                ]);
                break;

            case 'delete':
                $workshopId = $input['workshopId'] ?? '';

                if (empty($workshopId)) {
                    echo json_encode(['success' => false, 'error' => 'ID de taller requerido']);
                    exit;
                }

                $initialCount = count($db['workshops']);
                $db['workshops'] = array_filter($db['workshops'], function ($w) use ($workshopId) {
                    return $w['id'] !== $workshopId;
                });
                $db['workshops'] = array_values($db['workshops']);

                if (count($db['workshops']) === $initialCount) {
                    echo json_encode(['success' => false, 'error' => 'Taller no encontrado']);
                    exit;
                }

                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Taller eliminado']);
                break;

            case 'verify':
                // RF-2: Verificar requisitos para habilitar taller
                $workshopId = $input['workshopId'] ?? '';

                if (empty($workshopId)) {
                    echo json_encode(['success' => false, 'error' => 'ID de taller requerido']);
                    exit;
                }

                $workshop = null;
                foreach ($db['workshops'] as $w) {
                    if ($w['id'] === $workshopId) {
                        $workshop = $w;
                        break;
                    }
                }

                if (!$workshop) {
                    echo json_encode(['success' => false, 'error' => 'Taller no encontrado']);
                    exit;
                }

                // Verificar requisitos
                $issues = [];
                if (empty($workshop['teacherId'])) {
                    $issues[] = 'No tiene docente asignado';
                }
                if (empty($workshop['schedule'])) {
                    $issues[] = 'No tiene horario definido';
                }
                if (($workshop['capacity'] ?? 0) < 5) {
                    $issues[] = 'Capacidad mínima debe ser 5 alumnos';
                }

                $canActivate = count($issues) === 0;

                echo json_encode([
                    'success' => true,
                    'canActivate' => $canActivate,
                    'issues' => $issues,
                    'workshop' => $workshop
                ]);
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no permitido']);
}
?>