<?php
/**
 * API Endpoint para Gestión de Grupos (RF-2)
 * CRUD completo para grupos escolares
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dbPath = __DIR__ . '/../data/database.json';

function readDB($path)
{
    if (!file_exists($path)) {
        return ['groups' => []];
    }
    $content = file_get_contents($path);
    return json_decode($content, true);
}

function writeDB($path, $data)
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function generateGroupId($groups)
{
    $maxId = 0;
    foreach ($groups as $group) {
        $num = intval(substr($group['id'], 3));
        if ($num > $maxId)
            $maxId = $num;
    }
    return 'GRP' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);
}

$method = $_SERVER['REQUEST_METHOD'];
$db = readDB($dbPath);

if (!isset($db['groups'])) {
    $db['groups'] = [];
}

switch ($method) {
    case 'GET':
        // Obtener todos los grupos o filtrar
        $groups = $db['groups'];

        // Filtrar por nivel si se especifica
        if (isset($_GET['level'])) {
            $level = $_GET['level'];
            $groups = array_filter($groups, function ($g) use ($level) {
                return $g['level'] === $level;
            });
            $groups = array_values($groups);
        }

        // Filtrar por docente si se especifica
        if (isset($_GET['teacherId'])) {
            $teacherId = $_GET['teacherId'];
            $groups = array_filter($groups, function ($g) use ($teacherId) {
                return $g['teacherId'] === $teacherId;
            });
            $groups = array_values($groups);
        }

        // Obtener grupo específico por ID
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $group = null;
            foreach ($db['groups'] as $g) {
                if ($g['id'] === $id) {
                    $group = $g;
                    break;
                }
            }
            echo json_encode($group ?: ['error' => 'Grupo no encontrado']);
            exit;
        }

        echo json_encode($groups);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'create';

        switch ($action) {
            case 'create':
                // Validar campos requeridos
                if (empty($input['name']) || empty($input['level'])) {
                    echo json_encode(['success' => false, 'error' => 'Nombre y nivel son requeridos']);
                    exit;
                }

                $newGroup = [
                    'id' => generateGroupId($db['groups']),
                    'name' => $input['name'],
                    'level' => $input['level'],
                    'grade' => $input['grade'] ?? '',
                    'section' => $input['section'] ?? '',
                    'teacherId' => $input['teacherId'] ?? '',
                    'teacherName' => $input['teacherName'] ?? '',
                    'studentIds' => $input['studentIds'] ?? [],
                    'schedule' => $input['schedule'] ?? 'Matutino',
                    'year' => $input['year'] ?? date('Y')
                ];

                $db['groups'][] = $newGroup;
                writeDB($dbPath, $db);

                echo json_encode(['success' => true, 'group' => $newGroup]);
                break;

            case 'update':
                if (empty($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de grupo requerido']);
                    exit;
                }

                $found = false;
                foreach ($db['groups'] as &$group) {
                    if ($group['id'] === $input['id']) {
                        // Actualizar campos
                        if (isset($input['name']))
                            $group['name'] = $input['name'];
                        if (isset($input['level']))
                            $group['level'] = $input['level'];
                        if (isset($input['grade']))
                            $group['grade'] = $input['grade'];
                        if (isset($input['section']))
                            $group['section'] = $input['section'];
                        if (isset($input['teacherId']))
                            $group['teacherId'] = $input['teacherId'];
                        if (isset($input['teacherName']))
                            $group['teacherName'] = $input['teacherName'];
                        if (isset($input['studentIds']))
                            $group['studentIds'] = $input['studentIds'];
                        if (isset($input['schedule']))
                            $group['schedule'] = $input['schedule'];
                        if (isset($input['year']))
                            $group['year'] = $input['year'];
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Grupo no encontrado']);
                }
                break;

            case 'assignTeacher':
                if (empty($input['groupId']) || empty($input['teacherId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de grupo y docente requeridos']);
                    exit;
                }

                $found = false;
                foreach ($db['groups'] as &$group) {
                    if ($group['id'] === $input['groupId']) {
                        $group['teacherId'] = $input['teacherId'];
                        $group['teacherName'] = $input['teacherName'] ?? '';
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Grupo no encontrado']);
                }
                break;

            case 'addStudent':
                if (empty($input['groupId']) || empty($input['studentId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de grupo y alumno requeridos']);
                    exit;
                }

                $found = false;
                foreach ($db['groups'] as &$group) {
                    if ($group['id'] === $input['groupId']) {
                        if (!in_array($input['studentId'], $group['studentIds'])) {
                            $group['studentIds'][] = $input['studentId'];
                        }
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Grupo no encontrado']);
                }
                break;

            case 'removeStudent':
                if (empty($input['groupId']) || empty($input['studentId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de grupo y alumno requeridos']);
                    exit;
                }

                $found = false;
                foreach ($db['groups'] as &$group) {
                    if ($group['id'] === $input['groupId']) {
                        $group['studentIds'] = array_values(array_filter($group['studentIds'], function ($id) use ($input) {
                            return $id !== $input['studentId'];
                        }));
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Grupo no encontrado']);
                }
                break;

            case 'delete':
                if (empty($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de grupo requerido']);
                    exit;
                }

                $initialCount = count($db['groups']);
                $db['groups'] = array_values(array_filter($db['groups'], function ($g) use ($input) {
                    return $g['id'] !== $input['id'];
                }));

                if (count($db['groups']) < $initialCount) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Grupo no encontrado']);
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
