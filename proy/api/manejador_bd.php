<?php

// Clase manejadora de la base de datos JSON

class BD
{
    private $archivoBaseDatos;

    public function __construct()
    {
        // Ruta al archivo JSON de la base de datos
        $this->archivoBaseDatos = __DIR__ . '/../data/database.json';
    }

    // Obtener todos los datos de la base de datos
    public function obtenerDatos()
    {
        if (!file_exists($this->archivoBaseDatos)) {
            return ['users' => [], 'absences' => []];
        }
        $json = file_get_contents($this->archivoBaseDatos);
        return json_decode($json, true);
    }

    // Guardar datos en la base de datos
    public function guardarDatos($datos)
    {
        $json = json_encode($datos, JSON_PRETTY_PRINT);
        return file_put_contents($this->archivoBaseDatos, $json);
    }

    // Obtener lista de usuarios
    public function obtenerUsuarios()
    {
        $datos = $this->obtenerDatos();
        return $datos['users'] ?? [];
    }

    // Obtener lista de inasistencias
    public function obtenerInasistencias()
    {
        $datos = $this->obtenerDatos();
        return $datos['absences'] ?? [];
    }
}
?>
