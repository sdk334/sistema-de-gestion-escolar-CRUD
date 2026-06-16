<?php
/**
 * API: Calendario Académico SEP (RN-25)
 * Gestión de calendario oficial con días festivos y períodos
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
        return ['calendar' => []];
    }
    $content = file_get_contents($dbPath);
    return json_decode($content, true) ?: ['calendar' => []];
}

function guardarBD($data)
{
    global $dbPath;
    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = leerBD();

// Inicializar calendario si no existe
if (!isset($db['calendar'])) {
    $db['calendar'] = [
        'schoolYear' => '2025-2026',
        'holidays' => [],
        'periods' => [],
        'events' => []
    ];
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'full';

        switch ($action) {
            case 'full':
                echo json_encode([
                    'success' => true,
                    'data' => $db['calendar']
                ]);
                break;

            case 'holidays':
                echo json_encode([
                    'success' => true,
                    'data' => $db['calendar']['holidays'] ?? []
                ]);
                break;

            case 'periods':
                echo json_encode([
                    'success' => true,
                    'data' => $db['calendar']['periods'] ?? []
                ]);
                break;

            case 'isSchoolDay':
                // Verificar si una fecha es día escolar
                $date = $_GET['date'] ?? date('Y-m-d');
                $isHoliday = false;
                $holidayName = null;

                foreach ($db['calendar']['holidays'] ?? [] as $h) {
                    if ($h['date'] === $date) {
                        $isHoliday = true;
                        $holidayName = $h['name'];
                        break;
                    }
                }

                // También verificar si es fin de semana
                $dayOfWeek = date('N', strtotime($date));
                $isWeekend = ($dayOfWeek >= 6);

                echo json_encode([
                    'success' => true,
                    'date' => $date,
                    'isSchoolDay' => !$isHoliday && !$isWeekend,
                    'isHoliday' => $isHoliday,
                    'holidayName' => $holidayName,
                    'isWeekend' => $isWeekend
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
            case 'addHoliday':
                // RN-25: Agregar día festivo
                if (empty($input['date']) || empty($input['name'])) {
                    echo json_encode(['success' => false, 'error' => 'Fecha y nombre son requeridos']);
                    exit;
                }

                $newHoliday = [
                    'id' => 'HOL' . uniqid(),
                    'date' => $input['date'],
                    'name' => $input['name'],
                    'type' => $input['type'] ?? 'sep', // sep, local, custom
                    'createdAt' => date('Y-m-d H:i:s')
                ];

                $db['calendar']['holidays'][] = $newHoliday;
                guardarBD($db);

                echo json_encode([
                    'success' => true,
                    'message' => 'Día festivo agregado',
                    'holiday' => $newHoliday
                ]);
                break;

            case 'removeHoliday':
                $holidayId = $input['holidayId'] ?? '';

                if (empty($holidayId)) {
                    echo json_encode(['success' => false, 'error' => 'ID de día festivo requerido']);
                    exit;
                }

                $db['calendar']['holidays'] = array_filter(
                    $db['calendar']['holidays'] ?? [],
                    function ($h) use ($holidayId) {
                        return $h['id'] !== $holidayId;
                    }
                );
                $db['calendar']['holidays'] = array_values($db['calendar']['holidays']);

                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Día festivo eliminado']);
                break;

            case 'addPeriod':
                // RN-25: Agregar período académico
                if (empty($input['name']) || empty($input['startDate']) || empty($input['endDate'])) {
                    echo json_encode(['success' => false, 'error' => 'Nombre, fecha inicio y fin son requeridos']);
                    exit;
                }

                $newPeriod = [
                    'id' => 'PER' . uniqid(),
                    'name' => $input['name'],
                    'type' => $input['type'] ?? 'bimester', // bimester, semester, vacation
                    'startDate' => $input['startDate'],
                    'endDate' => $input['endDate'],
                    'level' => $input['level'] ?? 'all', // Kinder, Primaria, etc. o 'all'
                    'createdAt' => date('Y-m-d H:i:s')
                ];

                $db['calendar']['periods'][] = $newPeriod;
                guardarBD($db);

                echo json_encode([
                    'success' => true,
                    'message' => 'Período agregado',
                    'period' => $newPeriod
                ]);
                break;

            case 'removePeriod':
                $periodId = $input['periodId'] ?? '';

                if (empty($periodId)) {
                    echo json_encode(['success' => false, 'error' => 'ID de período requerido']);
                    exit;
                }

                $db['calendar']['periods'] = array_filter(
                    $db['calendar']['periods'] ?? [],
                    function ($p) use ($periodId) {
                        return $p['id'] !== $periodId;
                    }
                );
                $db['calendar']['periods'] = array_values($db['calendar']['periods']);

                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Período eliminado']);
                break;

            case 'setSchoolYear':
                $db['calendar']['schoolYear'] = $input['schoolYear'] ?? date('Y') . '-' . (date('Y') + 1);
                guardarBD($db);
                echo json_encode(['success' => true, 'message' => 'Ciclo escolar actualizado']);
                break;

            case 'importSEP':
                // RN-25: Importar calendario oficial SEP (predefinido)
                $year = $input['year'] ?? date('Y');

                $sepHolidays = [
                    ['date' => "$year-01-01", 'name' => 'Año Nuevo', 'type' => 'sep'],
                    ['date' => "$year-02-03", 'name' => 'Día de la Constitución', 'type' => 'sep'],
                    ['date' => "$year-03-17", 'name' => 'Natalicio de Benito Juárez', 'type' => 'sep'],
                    ['date' => "$year-05-01", 'name' => 'Día del Trabajo', 'type' => 'sep'],
                    ['date' => "$year-05-05", 'name' => 'Batalla de Puebla', 'type' => 'sep'],
                    ['date' => "$year-05-15", 'name' => 'Día del Maestro', 'type' => 'sep'],
                    ['date' => "$year-09-16", 'name' => 'Día de la Independencia', 'type' => 'sep'],
                    ['date' => "$year-11-02", 'name' => 'Día de Muertos', 'type' => 'sep'],
                    ['date' => "$year-11-18", 'name' => 'Revolución Mexicana', 'type' => 'sep'],
                    ['date' => "$year-12-25", 'name' => 'Navidad', 'type' => 'sep']
                ];

                foreach ($sepHolidays as $h) {
                    $h['id'] = 'HOL' . uniqid();
                    $h['createdAt'] = date('Y-m-d H:i:s');
                    $db['calendar']['holidays'][] = $h;
                }

                // Agregar períodos académicos predeterminados
                $prevYear = $year - 1;
                $sepPeriods = [
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Primer Bimestre',
                        'type' => 'bimester',
                        'startDate' => "$prevYear-08-28",
                        'endDate' => "$prevYear-10-27",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Segundo Bimestre',
                        'type' => 'bimester',
                        'startDate' => "$prevYear-10-28",
                        'endDate' => "$prevYear-12-15",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Vacaciones de Invierno',
                        'type' => 'vacation',
                        'startDate' => "$prevYear-12-16",
                        'endDate' => "$year-01-06",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Tercer Bimestre',
                        'type' => 'bimester',
                        'startDate' => "$year-01-07",
                        'endDate' => "$year-02-28",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Cuarto Bimestre',
                        'type' => 'bimester',
                        'startDate' => "$year-03-01",
                        'endDate' => "$year-04-30",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Vacaciones de Semana Santa',
                        'type' => 'vacation',
                        'startDate' => "$year-04-14",
                        'endDate' => "$year-04-25",
                        'level' => 'all'
                    ],
                    [
                        'id' => 'PER' . uniqid(),
                        'name' => 'Quinto Bimestre',
                        'type' => 'bimester',
                        'startDate' => "$year-05-01",
                        'endDate' => "$year-07-15",
                        'level' => 'all'
                    ]
                ];

                foreach ($sepPeriods as $p) {
                    $p['createdAt'] = date('Y-m-d H:i:s');
                    $db['calendar']['periods'][] = $p;
                }

                guardarBD($db);
                echo json_encode([
                    'success' => true,
                    'message' => 'Calendario SEP importado con períodos',
                    'imported' => count($sepHolidays),
                    'periodsImported' => count($sepPeriods)
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