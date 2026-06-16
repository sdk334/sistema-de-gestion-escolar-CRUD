<?php
/**
 * API Endpoint para Inscripciones Universitarias (RF-9, RF-10)
 * Gestión de inscripción y baja de materias
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
        return ['enrollments' => []];
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

if (!isset($db['enrollments'])) {
    $db['enrollments'] = [];
}

switch ($method) {
    case 'GET':
        $enrollments = $db['enrollments'];

        // Filtrar por estudiante
        if (isset($_GET['studentId'])) {
            $studentId = $_GET['studentId'];
            $enrollments = array_filter($enrollments, function ($e) use ($studentId) {
                return $e['studentId'] === $studentId && $e['status'] === 'Inscrito';
            });
            $enrollments = array_values($enrollments);
        }

        echo json_encode($enrollments);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'enroll';

        switch ($action) {
            case 'enroll':
                // RF-9: Inscribir a materia
                if (empty($input['studentId']) || empty($input['subjectId'])) {
                    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
                    exit;
                }

                // Verificar que no esté ya inscrito
                $alreadyEnrolled = false;
                foreach ($db['enrollments'] as $e) {
                    if (
                        $e['studentId'] === $input['studentId'] &&
                        $e['subjectId'] === $input['subjectId'] &&
                        $e['status'] === 'Inscrito'
                    ) {
                        $alreadyEnrolled = true;
                        break;
                    }
                }

                if ($alreadyEnrolled) {
                    echo json_encode(['success' => false, 'error' => 'Ya está inscrito en esta materia']);
                    exit;
                }

                // Contar materias inscritas (RN-12: máximo)
                $enrolledCount = 0;
                foreach ($db['enrollments'] as $e) {
                    if ($e['studentId'] === $input['studentId'] && $e['status'] === 'Inscrito') {
                        $enrolledCount++;
                    }
                }

                // RN-12: Máximo 8 materias
                if ($enrolledCount >= 8) {
                    echo json_encode(['success' => false, 'error' => 'Límite máximo de 8 materias alcanzado (RN-12)']);
                    exit;
                }

                // RN-23: Control de Recursamiento Limitado
                // Un alumno no puede recursar la misma materia más de una vez
                $recourseCount = 0;
                foreach ($db['enrollments'] as $e) {
                    if (
                        $e['studentId'] === $input['studentId'] &&
                        $e['subjectId'] === $input['subjectId'] &&
                        $e['status'] === 'Baja'  // Contamos bajas previas como intentos de recursamiento
                    ) {
                        $recourseCount++;
                    }
                }

                if ($recourseCount >= 1) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'No puede inscribirse en esta materia. Ya ha recursado esta materia anteriormente (RN-23: máximo 1 recursamiento permitido).'
                    ]);
                    exit;
                }

                // Determinar si es recursamiento (tiene historial de baja en esta materia)
                $isRecourse = $recourseCount > 0;

                $newEnrollment = [
                    'id' => uniqid('ENR'),
                    'studentId' => $input['studentId'],
                    'subjectId' => $input['subjectId'],
                    'subjectName' => $input['subjectName'] ?? '',
                    'credits' => $input['credits'] ?? 0,
                    'status' => 'Inscrito',
                    'enrolledAt' => date('Y-m-d H:i:s'),
                    'semester' => $input['semester'] ?? date('Y') . '-1',
                    'recourseCount' => $recourseCount,  // RN-23: Track recourse attempts
                    'isRecourse' => $isRecourse
                ];

                $db['enrollments'][] = $newEnrollment;
                writeDB($dbPath, $db);

                echo json_encode(['success' => true, 'enrollment' => $newEnrollment]);
                break;

            case 'drop':
                // RF-10: Dar de baja materia
                if (empty($input['enrollmentId'])) {
                    echo json_encode(['success' => false, 'error' => 'ID de inscripción requerido']);
                    exit;
                }

                $found = false;
                foreach ($db['enrollments'] as &$enrollment) {
                    if ($enrollment['id'] === $input['enrollmentId']) {
                        $enrollment['status'] = 'Baja';
                        $enrollment['droppedAt'] = date('Y-m-d H:i:s');
                        $enrollment['dropReason'] = $input['reason'] ?? '';
                        $found = true;
                        break;
                    }
                }

                if ($found) {
                    writeDB($dbPath, $db);
                    echo json_encode(['success' => true, 'message' => 'Materia dada de baja correctamente']);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Inscripción no encontrada']);
                }
                break;

            case 'getStats':
                // Estadísticas del estudiante
                $studentId = $input['studentId'] ?? '';
                $enrolled = 0;
                $dropped = 0;
                $totalCredits = 0;

                foreach ($db['enrollments'] as $e) {
                    if ($e['studentId'] === $studentId) {
                        if ($e['status'] === 'Inscrito') {
                            $enrolled++;
                            $totalCredits += $e['credits'] ?? 0;
                        } else if ($e['status'] === 'Baja') {
                            $dropped++;
                        }
                    }
                }

                echo json_encode([
                    'enrolled' => $enrolled,
                    'dropped' => $dropped,
                    'totalCredits' => $totalCredits,
                    'maxSubjects' => 8
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