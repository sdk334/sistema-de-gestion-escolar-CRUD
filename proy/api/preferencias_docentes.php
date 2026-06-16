<?php
/**
 * API: Preferencias Docentes y Asignación Automática (RN-2, RN-3)
 * Gestiona preferencias de docentes y asignación por antigüedad
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
        return ['users' => [], 'teacherPreferences' => []];
    }
    $content = file_get_contents($dbPath);
    return json_decode($content, true) ?: ['users' => [], 'teacherPreferences' => []];
}

function guardarBD($data)
{
    global $dbPath;
    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = leerBD();

if (!isset($db['teacherPreferences'])) {
    $db['teacherPreferences'] = [];
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';

        switch ($action) {
            case 'list':
                // Listar preferencias de todos los docentes
                $teachers = array_filter($db['users'], function ($u) {
                    return $u['role'] === 'docente' && ($u['status'] ?? 'active') === 'active';
                });

                $result = [];
                foreach ($teachers as $teacher) {
                    $prefs = null;
                    foreach ($db['teacherPreferences'] as $p) {
                        if ($p['teacherId'] === $teacher['id']) {
                            $prefs = $p;
                            break;
                        }
                    }

                    $result[] = [
                        'teacherId' => $teacher['id'],
                        'teacherName' => $teacher['name'],
                        'specialty' => $teacher['specialty'] ?? '',
                        'level' => $teacher['level'] ?? '',
                        'seniority' => $teacher['seniority'] ?? 0, // años de antigüedad
                        'hasPreferences' => $prefs !== null,
                        'preferences' => $prefs,
                        // RN-3: Si no tiene preferencias, se marca como pendiente de penalización
                        'penaltyApplies' => $prefs === null
                    ];
                }

                // RN-2: Ordenar por antigüedad (mayor primero)
                usort($result, function ($a, $b) {
                    return ($b['seniority'] ?? 0) - ($a['seniority'] ?? 0);
                });

                echo json_encode(['success' => true, 'data' => $result]);
                break;

            case 'byTeacher':
                $teacherId = $_GET['teacherId'] ?? '';
                if (empty($teacherId)) {
                    echo json_encode(['success' => false, 'error' => 'teacherId requerido']);
                    exit;
                }

                $prefs = null;
                foreach ($db['teacherPreferences'] as $p) {
                    if ($p['teacherId'] === $teacherId) {
                        $prefs = $p;
                        break;
                    }
                }

                echo json_encode(['success' => true, 'data' => $prefs]);
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';

        switch ($action) {
            case 'save':
                // RN-3: Guardar preferencias del docente
                $teacherId = $input['teacherId'] ?? '';

                if (empty($teacherId)) {
                    echo json_encode(['success' => false, 'error' => 'teacherId requerido']);
                    exit;
                }

                // Buscar si ya existe preferencias
                $found = false;
                foreach ($db['teacherPreferences'] as &$p) {
                    if ($p['teacherId'] === $teacherId) {
                        $p['preferredSubjects'] = $input['preferredSubjects'] ?? [];
                        $p['preferredSchedule'] = $input['preferredSchedule'] ?? '';
                        $p['maxSubjects'] = $input['maxSubjects'] ?? 6;
                        $p['notes'] = $input['notes'] ?? '';
                        $p['updatedAt'] = date('Y-m-d H:i:s');
                        $found = true;
                        break;
                    }
                }

                if (!$found) {
                    $db['teacherPreferences'][] = [
                        'id' => 'PREF' . uniqid(),
                        'teacherId' => $teacherId,
                        'preferredSubjects' => $input['preferredSubjects'] ?? [],
                        'preferredSchedule' => $input['preferredSchedule'] ?? '',
                        'maxSubjects' => $input['maxSubjects'] ?? 6,
                        'notes' => $input['notes'] ?? '',
                        'createdAt' => date('Y-m-d H:i:s')
                    ];
                }

                guardarBD($db);
                echo json_encode([
                    'success' => true,
                    'message' => 'Preferencias guardadas correctamente'
                ]);
                break;

            case 'setSeniority':
                // Establecer antigüedad del docente
                $teacherId = $input['teacherId'] ?? '';
                $seniority = $input['seniority'] ?? 0;

                if (empty($teacherId)) {
                    echo json_encode(['success' => false, 'error' => 'teacherId requerido']);
                    exit;
                }

                foreach ($db['users'] as &$user) {
                    if ($user['id'] === $teacherId) {
                        $user['seniority'] = (int) $seniority;
                        break;
                    }
                }

                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Antigüedad actualizada']);
                break;

            case 'autoAssign':
                // RN-2: Asignación automática por jerarquía (antigüedad)
                $subjectId = $input['subjectId'] ?? '';
                $subjectName = $input['subjectName'] ?? '';

                if (empty($subjectId)) {
                    echo json_encode(['success' => false, 'error' => 'subjectId requerido']);
                    exit;
                }

                // Obtener docentes ordenados por antigüedad
                $teachers = array_filter($db['users'], function ($u) {
                    return $u['role'] === 'docente' && ($u['status'] ?? 'active') === 'active';
                });

                // Ordenar por antigüedad (mayor primero)
                usort($teachers, function ($a, $b) {
                    return ($b['seniority'] ?? 0) - ($a['seniority'] ?? 0);
                });

                // Contar materias asignadas a cada docente
                $teacherSubjects = $db['teacherSubjects'] ?? [];
                $subjectCounts = [];
                foreach ($teacherSubjects as $ts) {
                    if ($ts['status'] === 'active') {
                        $subjectCounts[$ts['teacherId']] = ($subjectCounts[$ts['teacherId']] ?? 0) + 1;
                    }
                }

                // Buscar docente disponible con preferencia para esta materia
                $assignedTeacher = null;

                // Primero: buscar por preferencia + antigüedad
                foreach ($teachers as $teacher) {
                    // Verificar si tiene preferencias
                    $prefs = null;
                    foreach ($db['teacherPreferences'] as $p) {
                        if ($p['teacherId'] === $teacher['id']) {
                            $prefs = $p;
                            break;
                        }
                    }

                    // RN-3: Docentes sin preferencias tienen menor prioridad
                    if ($prefs && in_array($subjectId, $prefs['preferredSubjects'] ?? [])) {
                        // Verificar que no exceda máximo
                        $currentCount = $subjectCounts[$teacher['id']] ?? 0;
                        $maxSubjects = $prefs['maxSubjects'] ?? 6;

                        if ($currentCount < $maxSubjects) {
                            $assignedTeacher = $teacher;
                            break;
                        }
                    }
                }

                // Segundo: si nadie tiene preferencia, asignar al de mayor antigüedad con espacio
                if (!$assignedTeacher) {
                    foreach ($teachers as $teacher) {
                        $currentCount = $subjectCounts[$teacher['id']] ?? 0;
                        if ($currentCount < 6) { // Máximo por defecto
                            $assignedTeacher = $teacher;
                            break;
                        }
                    }
                }

                if (!$assignedTeacher) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'No hay docentes disponibles para esta materia'
                    ]);
                    exit;
                }

                // Crear asignación
                if (!isset($db['teacherSubjects'])) {
                    $db['teacherSubjects'] = [];
                }

                $newAssignment = [
                    'id' => 'TS' . uniqid(),
                    'teacherId' => $assignedTeacher['id'],
                    'subjectId' => $subjectId,
                    'subjectName' => $subjectName,
                    'status' => 'active',
                    'assignedAt' => date('Y-m-d H:i:s'),
                    'assignmentType' => 'auto' // RN-2: asignación automática
                ];

                $db['teacherSubjects'][] = $newAssignment;
                guardarBD($db);

                echo json_encode([
                    'success' => true,
                    'message' => 'Materia asignada automáticamente',
                    'assignedTo' => [
                        'teacherId' => $assignedTeacher['id'],
                        'teacherName' => $assignedTeacher['name'],
                        'seniority' => $assignedTeacher['seniority'] ?? 0
                    ],
                    'assignment' => $newAssignment
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