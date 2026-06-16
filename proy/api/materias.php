<?php
/**
 * API Endpoint para Gestión de Materias (RF-15)
 * CRUD completo para materias/asignaturas
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
        return ['subjects' => []];
    }
    $content = file_get_contents($path);
    return json_decode($content, true);
}

function writeDB($path, $data)
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function generateSubjectId($subjects)
{
    $maxId = 0;
    foreach ($subjects as $subject) {
        preg_match('/(\d+)$/', $subject['id'], $matches);
        if (isset($matches[1]) && intval($matches[1]) > $maxId) {
            $maxId = intval($matches[1]);
        }
    }
    return 'SUB' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);
}

$method = $_SERVER['REQUEST_METHOD'];
$db = readDB($dbPath);

if (!isset($db['subjects'])) {
    $db['subjects'] = [];
}

switch ($method) {
    case 'GET':
        $subjects = $db['subjects'];

        // Filtrar por nivel si se especifica (soporta level singular o levels array)
        if (isset($_GET['level'])) {
            $level = $_GET['level'];
            $subjects = array_filter($subjects, function ($s) use ($level) {
                // Soporta nueva estructura (level) y antigua (levels)
                if (isset($s['level']) && $s['level'] === $level) {
                    return true;
                }
                if (isset($s['levels']) && in_array($level, $s['levels'])) {
                    return true;
                }
                return false;
            });
            $subjects = array_values($subjects);
        }


        // Obtener materia específica por ID
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $subject = null;
            foreach ($db['subjects'] as $s) {
                if ($s['id'] === $id) {
                    $subject = $s;
                    break;
                }
            }
            echo json_encode($subject ?: ['error' => 'Materia no encontrada']);
            exit;
        }

        echo json_encode($subjects);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'create';

        switch ($action) {
            case 'create':
                if (empty($input['name'])) {
                    echo json_encode(['success' => false, 'error' => 'Nombre de materia requerido']);
                    exit;
                }

                // Soportar tanto 'level' (singular) como 'levels' (array)
                $level = $input['level'] ?? null;
                $levels = $input['levels'] ?? [];

                // Si se pasó level singular, usarlo como valor principal
                if ($level && empty($levels)) {
                    $levels = [$level];
                }

                $newSubject = [
                    'id' => generateSubjectId($db['subjects']),
                    'name' => $input['name'],
                    'level' => $level,  // Campo singular para compatibilidad
                    'levels' => $levels, // Campo array para múltiples niveles
                    'credits' => $input['credits'] ?? 4,
                    'description' => $input['description'] ?? '',
                    'teacherId' => $input['teacherId'] ?? null
                ];

                $db['subjects'][] = $newSubject;
                writeDB($dbPath, $db);

                echo json_encode(['success' => true, 'subject' => $newSubject]);
                break;

            case 'update':
                if (empty($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de materia requerido']);
                    exit;
                }

                $found = false;
                foreach ($db['subjects'] as &$subject) {
                    if ($subject['id'] === $input['id']) {
                        if (isset($input['name']))
                            $subject['name'] = $input['name'];
                        if (isset($input['levels']))
                            $subject['levels'] = $input['levels'];
                        if (isset($input['credits']))
                            $subject['credits'] = $input['credits'];
                        if (isset($input['description']))
                            $subject['description'] = $input['description'];
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Materia no encontrada']);
                }
                break;

            case 'delete':
                if (empty($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de materia requerido']);
                    exit;
                }

                $initialCount = count($db['subjects']);
                $db['subjects'] = array_values(array_filter($db['subjects'], function ($s) use ($input) {
                    return $s['id'] !== $input['id'];
                }));

                if (count($db['subjects']) < $initialCount) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Materia no encontrada']);
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