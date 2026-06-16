<?php
// api/horarios.php
// Endpoint para obtener y validar horarios por nivel educativo

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'manejador_bd.php';

$bd = new BD();
$datos = $bd->obtenerDatos();

// POST: Validar y crear/actualizar horario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'create';

    if ($action === 'validate' || $action === 'create') {
        $schedule = $input['schedule'] ?? null;

        if (!$schedule || !isset($schedule['classes'])) {
            echo json_encode(['success' => false, 'error' => 'Datos de horario inválidos']);
            exit;
        }

        // RF-2, RN-11, RN-12: Validaciones de horario
        $errors = validateSchedule($schedule['classes']);

        if (count($errors) > 0) {
            echo json_encode(['success' => false, 'errors' => $errors]);
            exit;
        }

        if ($action === 'create') {
            // Guardar horario
            if (!isset($datos['schedules'])) {
                $datos['schedules'] = [];
            }

            // Buscar si ya existe para este nivel
            $found = false;
            foreach ($datos['schedules'] as &$s) {
                if ($s['level'] === $schedule['level']) {
                    $s['classes'] = $schedule['classes'];
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $datos['schedules'][] = $schedule;
            }

            $bd->guardarDatos($datos);
            echo json_encode(['success' => true, 'message' => 'Horario guardado correctamente']);
        } else {
            echo json_encode(['success' => true, 'valid' => true, 'message' => 'Horario válido']);
        }
        exit;
    }
}

// GET: Obtener horarios
$level = isset($_GET['level']) ? $_GET['level'] : null;
$schedules = isset($datos['schedules']) ? $datos['schedules'] : [];

if ($level) {
    $filtered = array_filter($schedules, function ($s) use ($level) {
        return $s['level'] === $level;
    });

    if (count($filtered) > 0) {
        echo json_encode(array_values($filtered)[0]);
    } else {
        echo json_encode(['level' => $level, 'classes' => []]);
    }
} else {
    echo json_encode($schedules);
}

/**
 * Validar estructura de horario según RN-11 y RN-12
 * - RN-11: Duración de materia 1:30 hrs, inicio 7am
 * - RN-12: Descanso 30 min después de cada 2 clases
 */
function validateSchedule($classes)
{
    $errors = [];

    // Agrupar clases por día
    $byDay = [];
    foreach ($classes as $class) {
        $day = $class['day'] ?? 'Lunes';
        if (!isset($byDay[$day])) {
            $byDay[$day] = [];
        }
        $byDay[$day][] = $class;
    }

    foreach ($byDay as $day => $dayClasses) {
        // Ordenar por hora de inicio
        usort($dayClasses, function ($a, $b) {
            return strcmp($a['startTime'] ?? '07:00', $b['startTime'] ?? '07:00');
        });

        $classCount = 0;
        $lastEndTime = null;

        foreach ($dayClasses as $index => $class) {
            $startTime = $class['startTime'] ?? '07:00';
            $endTime = $class['endTime'] ?? '08:30';

            // RN-11: Validar hora de inicio (7:00 AM mínimo)
            if ($startTime < '07:00') {
                $errors[] = "[$day] La clase '{$class['subject']}' inicia antes de las 7:00 AM";
            }

            // RN-11: Validar duración (1:30 hrs = 90 minutos)
            $startMinutes = timeToMinutes($startTime);
            $endMinutes = timeToMinutes($endTime);
            $duration = $endMinutes - $startMinutes;

            if ($duration !== 90) {
                $errors[] = "[$day] La clase '{$class['subject']}' debe durar exactamente 1:30 hrs (90 min), tiene {$duration} min";
            }

            // RN-12: Validar descanso después de cada 2 clases
            $classCount++;
            if ($classCount === 2 && $lastEndTime !== null) {
                // Después de la 2da clase, debe haber 30 min de descanso
                if ($index + 1 < count($dayClasses)) {
                    $nextStart = timeToMinutes($dayClasses[$index + 1]['startTime'] ?? '');
                    $currentEnd = timeToMinutes($endTime);
                    $break = $nextStart - $currentEnd;

                    if ($break < 30) {
                        $errors[] = "[$day] Debe haber 30 min de descanso después de '{$class['subject']}'";
                    }
                }
                $classCount = 0; // Reiniciar contador
            }

            $lastEndTime = $endTime;
        }
    }

    return $errors;
}

function timeToMinutes($time)
{
    $parts = explode(':', $time);
    return (int) $parts[0] * 60 + (int) ($parts[1] ?? 0);
}
?>