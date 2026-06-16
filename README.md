# SchoolHub — Sistema de Gestión Escolar Integral

---

## Descripción

**SchoolHub** es una plataforma web de gestión escolar diseñada para centralizar y optimizar la administración de instituciones educativas desde nivel Kínder hasta Universidad. Permite administrar alumnos, docentes, grupos, materias, calificaciones, asistencias y más, todo desde una interfaz moderna y responsiva.

El identificador único del alumno (boleta) persiste a lo largo de toda su trayectoria escolar, garantizando la integridad del expediente digital sin importar los cambios de nivel o área.

---

## Tecnologías Utilizadas

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5, CSS3, JavaScript (67%) |
| Backend | PHP 7.4+ (28%) |
| Base de Datos | JSON (`data/database.json`) / MySQL opcional vía phpMyAdmin |
| Servidor | XAMPP (Apache + MySQL) |
| Estilos | CSS personalizado (3.7%) |

---

## Estructura del Proyecto

```
SchoolHub/
├── api/                  # Scripts PHP (lógica del servidor)
│   ├── iniciar_sesion.php
│   ├── alumnos.php
│   └── manejador_bd.php
├── css/
│   └── style.css
├── data/
│   └── database.json     # Almacén de datos principal
├── js/
│   ├── app.js
│   ├── auth.js
│   └── db.js
└── index.html            # Punto de entrada / login
```

> El proyecto en el repositorio se encuentra dentro de la carpeta `proy/`.

---

## Funcionalidades Principales

### Roles del Sistema

El sistema cuenta con cuatro tipos de usuario, cada uno con permisos específicos:

- **Administrador** — control total del sistema
- **Docente** — gestión de grupos, asistencia y calificaciones
- **Alumno** — consulta de información e inscripción de materias (nivel universitario)
- **Padre / Tutor** — monitoreo de calificaciones e incidencias

---

### Módulo Administrador

- **Gestión de Usuarios (CRUD):** Alta, edición, consulta y baja de Alumnos, Docentes y Tutores. Las cuentas eliminadas son permanentes; se recomienda suspender para conservar historial.
- **Infraestructura Académica:** Catálogo de materias por nivel (con 7 créditos por defecto), talleres y optativas para Secundaria y Preparatoria.
- **Gestión de Grupos:** Creación de grupos con nivel, grado, sección, turno (Matutino/Vespertino) y docente titular.
- **Horarios:** Generación de horarios de 07:00 a 14:30, con clases de 90 minutos y descanso de 30 min tras cada dos materias; sin traslapes.
- **Seguridad:** Desbloqueo manual de cuentas bloqueadas (tras 3 intentos fallidos) y restablecimiento de contraseñas.
- **Reportes PDF:** Boletas por periodo, listas de asistencia e incidencias/sanciones.
- **Justificantes:** Revisión y aprobación de solicitudes de ausencias enviadas por alumnos.

### Módulo Docente

- Registro diario de asistencia por grupo.
- Captura de calificaciones por periodos (P1, P2, P3).
- En Kínder y Primaria: cada grupo tiene un único docente titular.

### Módulo Alumno

- Autogestión de inscripción a materias (alumnos universitarios desde 2° semestre): entre 4 y 8 materias con validación de créditos en tiempo real.
- Envío de justificantes de ausencia.
- El sistema bloquea la reinscripción a materias recursadas más de una vez.

### Módulo Padre / Tutor

- Consulta de calificaciones e incidencias del alumno.
- Los permisos de edición del tutor se revocan automáticamente cuando el alumno cumple 18 años o ingresa a Universidad.

---

## Seguridad

- Autenticación mediante Boleta (alumno) o Número de Empleado (docente/administrativo) + contraseña.
- **Sesión única:** el sistema bloquea el acceso desde un segundo dispositivo si ya hay una sesión activa.
- **Cierre automático** tras 3–5 minutos de inactividad.
- **Política de contraseñas:** mínimo 9 caracteres, con mayúscula, minúscula, número y carácter especial.
- Cuenta de administrador principal protegida: no puede ser eliminada ni suspendida desde la interfaz.
- Cumplimiento con lineamientos LFPDPPP.

---

## Instalación y Configuración

### Requisitos Previos

- Sistema Operativo: Windows 10/11, macOS o Linux
- **XAMPP** (recomendado) con Apache y MySQL activos
- PHP 7.4 o superior
- Navegador: Chrome 90+, Firefox 88+ o Edge 90+

### Pasos de Instalación

**1. Instalar XAMPP**

Descarga e instala XAMPP desde [apachefriends.org](https://www.apachefriends.org/). Inicia los servicios de **Apache** y **MySQL** desde el panel de control.

**2. Clonar el repositorio**

```bash
git clone https://github.com/sdk334/sistema-de-gestion-escolar-CRUD.git
```

**3. Copiar archivos al servidor**

Copia la carpeta del proyecto a:

```
C:\xampp\htdocs\SchoolHub\      # Windows
/opt/lampp/htdocs/SchoolHub/    # Linux
```

**4. Permisos de escritura** (Linux/Mac)

```bash
chmod 777 data/database.json
```

**5. Configurar base de datos MySQL (opcional)**

Si el proyecto usa MySQL en lugar del JSON:

1. Abre `http://localhost/phpmyadmin`
2. Crea la base de datos: `schoolhub_db`
3. Importa el archivo `.sql` incluido en el paquete (si existe)
4. Verifica la configuración de conexión en `api/manejador_bd.php`

**6. Acceder al sistema**

Abre tu navegador y visita:

```
http://localhost/SchoolHub
```

Deberías ver la pantalla de inicio de sesión.

---

## Credenciales de Prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | `admin` o `E100001` | (definida en `data/database.json`) |

> Si el sistema redirige al Dashboard tras el login, la instalación fue exitosa.

---

## Solución de Problemas

| Error | Causa probable | Solución |
|-------|----------------|----------|
| Error 404 | Nombre de carpeta incorrecto en `htdocs` | Verifica que la URL coincida exactamente con el nombre de la carpeta |
| No guarda datos / Error de API | Sin permisos de escritura en `data/` | Asigna permisos de escritura a `data/database.json` |
| Error de PHP | Librería o extensión faltante | Revisa `Apache > Logs > error.log` en el panel de XAMPP |

---

## Documentación Adicional

El repositorio incluye un **Manual de Usuario** en formato PDF (`manual de usuario.pdf`) con guías detalladas para cada módulo del sistema, capturas de pantalla y descripción completa de la interfaz.

---

## Autor

| Rol | Nombre |
|-----|--------|
| Desarrollador | Paredes Martínez Jonathan Uriel |

## Licencia

Proyecto académico de uso educativo. © 2026 SchoolHub – Sistema de Gestión Escolar.
