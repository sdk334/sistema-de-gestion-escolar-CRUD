<?php
/**
 * API: Asignación de Materias a Docentes (RF-5)
 * Permite asignar/desasignar materias a docentes y validar carga mínima (RN-1)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dbPath = __DIR__ . '/../data/database.json';

// Leer base de datos
function leerBD()
{
    global $dbPath;
    if (!file_exists($dbPath)) {
        return ['users' => [], 'subjects' => [], 'teacherSubjects' => []];
    }
    $content = file_get_contents($dbPath);
    return json_decode($content, true) ?: ['users' => [], 'subjects' => [], 'teacherSubjects' => []];
}

// Guardar base de datos
function guardarBD($data)
{
    global $dbPath;
    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Obtener carga docente (RN-1: mínimo 4 materias)
function obtenerCargaDocente($db, $teacherId)
{
    $subjects = [];
    $subjectIds = []; // Para evitar duplicados

    // 1. Buscar en teacherSubjects (asignaciones explícitas)
    $teacherSubjects = $db['teacherSubjects'] ?? [];
    foreach ($teacherSubjects as $ts) {
        if ($ts['teacherId'] === $teacherId && $ts['status'] === 'active') {
            $subjects[] = [
                'id' => $ts['id'],
                'subjectId' => $ts['subjectId'],
                'subjectName' => $ts['subjectName'],
                'source' => 'teacherSubjects'
            ];
            $subjectIds[] = $ts['subjectId'];
        }
    }

    // 2. Buscar en subjects donde teacherId está directamente asignado
    $allSubjects = $db['subjects'] ?? [];
    foreach ($allSubjects as $s) {
        $sTeacherId = $s['teacherId'] ?? null;
        if ($sTeacherId === $teacherId && !in_array($s['id'], $subjectIds)) {
            $subjects[] = [
                'id' => 'DIRECT_' . $s['id'],
                'subjectId' => $s['id'],
                'subjectName' => $s['name'],
                'source' => 'subjects'
            ];
        }
    }

    $count = count($subjects);

    return [
        'count' => $count,
        'subjects' => $subjects,
        'meetsMinimum' => $count >= 4,  // RN-1
        'minimumRequired' => 4
    ];
}

// Obtener todas las asignaciones con carga docente
function obtenerAsignaciones($db)
{
    $teachers = array_filter($db['users'] ?? [], function ($u) {
        return $u['role'] === 'docente' && ($u['status'] ?? 'active') === 'active';
    });

    $result = [];
    foreach ($teachers as $teacher) {
        $carga = obtenerCargaDocente($db, $teacher['id']);
        $result[] = [
            'teacherId' => $teacher['id'],
            'teacherName' => $teacher['name'],
            'specialty' => $teacher['specialty'] ?? '',
            'level' => $teacher['level'] ?? '',
            'subjectCount' => $carga['count'],
            'subjects' => $carga['subjects'],
            'meetsMinimum' => $carga['meetsMinimum']
        ];
    }

    return $result;
}

// Obtener materias sin docente (vacantes - RN-4)
function obtenerVacantes($db)
{
    $subjects = $db['subjects'] ?? [];
    $teacherSubjects = $db['teacherSubjects'] ?? [];

    // IDs de materias asignadas en teacherSubjects
    $assignedSubjectIds = array_map(function ($ts) {
        return $ts['subjectId'];
    }, array_filter($teacherSubjects, function ($ts) {
        return $ts['status'] === 'active';
    }));

    // Filtrar: materias sin docente = sin teacherId directo Y sin asignación en teacherSubjects
    $vacantes = array_filter($subjects, function ($s) use ($assignedSubjectIds) {
        $hasDirectTeacher = !empty($s['teacherId']);
        $hasAssignment = in_array($s['id'], $assignedSubjectIds);
        $isActive = ($s['status'] ?? 'active') === 'active';

        return !$hasDirectTeacher && !$hasAssignment && $isActive;
    });

    return array_values($vacantes);
}

// Manejar solicitudes GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = leerBD();
    $action = $_GET['action'] ?? 'list';

    switch ($action) {
        case 'list':
            // Lista de docentes con su carga
            echo json_encode([
                'success' => true,
                'data' => obtenerAsignaciones($db)
            ]);
            break;

        case 'vacancies':
            // Lista de materias sin docente (RN-4)
            echo json_encode([
                'success' => true,
                'data' => obtenerVacantes($db)
            ]);
            break;

        case 'teacherLoad':
            // Carga de un docente específico
            $teacherId = $_GET['teacherId'] ?? '';
            if (empty($teacherId)) {
                echo json_encode(['success' => false, 'error' => 'Se requiere teacherId']);
                exit;
            }
            echo json_encode([
                'success' => true,
                'data' => obtenerCargaDocente($db, $teacherId)
            ]);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    }
    exit;
}

// Manejar solicitudes POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    $db = leerBD();

    // Inicializar teacherSubjects si no existe
    if (!isset($db['teacherSubjects'])) {
        $db['teacherSubjects'] = [];
    }

    switch ($action) {
        case 'assign':
            // Asignar materia a docente
            $teacherId = $input['teacherId'] ?? '';
            $subjectId = $input['subjectId'] ?? '';
            $subjectName = $input['subjectName'] ?? '';

            if (empty($teacherId) || empty($subjectId)) {
                echo json_encode(['success' => false, 'error' => 'Se requiere teacherId y subjectId']);
                exit;
            }

            // Verificar que la materia no esté asignada a otro docente
            foreach ($db['teacherSubjects'] as $ts) {
                if ($ts['subjectId'] === $subjectId && $ts['status'] === 'active') {
                    echo json_encode(['success' => false, 'error' => 'Esta materia ya está asignada a otro docente']);
                    exit;
                }
            }

            // Crear nueva asignación
            $newAssignment = [
                'id' => 'TS' . uniqid(),
                'teacherId' => $teacherId,
                'subjectId' => $subjectId,
                'subjectName' => $subjectName,
                'status' => 'active',
                'assignedAt' => date('Y-m-d H:i:s')
            ];

            $db['teacherSubjects'][] = $newAssignment;
            guardarBD($db);

            $carga = obtenerCargaDocente($db, $teacherId);

            echo json_encode([
                'success' => true,
                'message' => 'Materia asignada correctamente',
                'assignment' => $newAssignment,
                'teacherLoad' => $carga
            ]);
            break;

        case 'unassign':
            // Desasignar materia de docente
            $assignmentId = $input['assignmentId'] ?? '';

            if (empty($assignmentId)) {
                echo json_encode(['success' => false, 'error' => 'Se requiere assignmentId']);
                exit;
            }

            $teacherId = null;
            foreach ($db['teacherSubjects'] as &$ts) {
                if ($ts['id'] === $assignmentId) {
                    $teacherId = $ts['teacherId'];
                    $ts['status'] = 'inactive';
                    $ts['unassignedAt'] = date('Y-m-d H:i:s');
                    break;
                }
            }

            if ($teacherId === null) {
                echo json_encode(['success' => false, 'error' => 'Asignación no encontrada']);
                exit;
            }

            guardarBD($db);

            $carga = obtenerCargaDocente($db, $teacherId);

            // Advertencia RN-1 si queda por debajo de 4 materias
            $warning = null;
            if (!$carga['meetsMinimum']) {
                $warning = "Advertencia (RN-1): El docente ahora tiene solo {$carga['count']} materias. El mínimo requerido es 4.";
            }

            echo json_encode([
                'success' => true,
                'message' => 'Materia desasignada correctamente',
                'warning' => $warning,
                'teacherLoad' => $carga
            ]);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Acción no válida']);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Método no permitido']);
?>