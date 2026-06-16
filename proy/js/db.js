// Constantes de roles de usuario
const ROLES = {
    ADMIN: 'admin',
    DOCENTE: 'docente',
    ALUMNO: 'alumno',
    TUTOR: 'tutor'
};

// Objeto de Base de Datos - Maneja todas las llamadas a la API
const BD = {
    // URL base de la API (ruta relativa)
    URL_API: 'api',

    // Autenticar usuario (inicio de sesión)
    async autenticar(nombreUsuario, contrasena) {
        try {
            const respuesta = await fetch(`${this.URL_API}/iniciar_sesion.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: nombreUsuario, password: contrasena })
            });
            const datos = await respuesta.json();
            return datos;
        } catch (error) {
            console.error('Error de Login:', error);
            return { success: false, error: 'Error de conexión con el servidor' };
        }
    },

    // Obtener lista de usuarios
    async obtenerUsuarios() {
        try {
            const respuesta = await fetch(`${this.URL_API}/obtener_usuarios.php`);
            return await respuesta.json();
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    },

    // Obtener lista de inasistencias
    async obtenerInasistencias() {
        try {
            const respuesta = await fetch(`${this.URL_API}/faltas.php`);
            return await respuesta.json();
        } catch (error) {
            console.error('Error al obtener inasistencias:', error);
            return [];
        }
    },

    // Justificar una inasistencia
    async justificarInasistencia(id, motivo) {
        try {
            const respuesta = await fetch(`${this.URL_API}/faltas.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, reason: motivo })
            });
            const datos = await respuesta.json();
            return datos.success;
        } catch (error) {
            console.error('Error al justificar:', error);
            return false;
        }
    },

    // Crear nuevo usuario
    async crearUsuario(datosUsuario) {
        try {
            const respuesta = await fetch(`${this.URL_API}/crear_usuario.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });
            return await respuesta.json();
        } catch (error) {
            console.error('Error al crear usuario:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    // Obtener calificaciones
    async obtenerCalificaciones() {
        try {
            const respuesta = await fetch(`${this.URL_API}/obtener_calificaciones.php`);
            return await respuesta.json();
        } catch (error) {
            console.error('Error al obtener calificaciones:', error);
            return [];
        }
    },

    // Guardar calificaciones
    async guardarCalificaciones(datosCalificaciones) {
        try {
            const respuesta = await fetch(`${this.URL_API}/guardar_calificaciones.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosCalificaciones)
            });
            return await respuesta.json();
        } catch (error) {
            console.error('Error al guardar calificaciones:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    // Obtener configuración
    async obtenerConfiguracion() {
        try {
            const respuesta = await fetch(`${this.URL_API}/obtener_configuracion.php`);
            return await respuesta.json();
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            return { enrollmentPeriod: 'active' };
        }
    },

    // Cambiar estado del periodo de inscripción
    async cambiarPeriodoInscripcion(type = 'higher') {
        try {
            const respuesta = await fetch(`${this.URL_API}/alternar_inscripcion.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            return await respuesta.json();
        } catch (error) {
            console.error('Error al cambiar periodo:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
};

// Alias para compatibilidad con código existente
const DB = {
    authenticate: (u, p) => BD.autenticar(u, p),
    getUsers: () => BD.obtenerUsuarios(),
    getAbsences: () => BD.obtenerInasistencias(),
    justifyAbsence: (id, r) => BD.justificarInasistencia(id, r),
    createUser: (d) => BD.crearUsuario(d),
    getGrades: () => BD.obtenerCalificaciones(),
    saveGrades: (d) => BD.guardarCalificaciones(d),
    toggleUserStatus: (id) => BD.cambiarEstatusUsuario(id),
    deleteUser: (id) => BD.eliminarUsuario(id),
    getSettings: () => BD.obtenerConfiguracion(),
    toggleEnrollmentPeriod: (type) => BD.cambiarPeriodoInscripcion(type),
    getSchedules: (level) => BD.obtenerHorarios(level)
};

// Método: Obtener horarios por nivel
BD.obtenerHorarios = async function (level) {
    try {
        let url = `${this.URL_API}/horarios.php`;
        if (level) url += `?level=${encodeURIComponent(level)}`;

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        return { level: level || '', classes: [] };
    }
};

// Método adicional: Cambiar estatus de usuario (activo/inactivo)
BD.cambiarEstatusUsuario = async function (idUsuario) {
    try {
        const respuesta = await fetch(`${this.URL_API}/actualizar_usuario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_status', userId: idUsuario })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al cambiar estatus:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método adicional: Eliminar usuario
BD.eliminarUsuario = async function (idUsuario) {
    try {
        const respuesta = await fetch(`${this.URL_API}/actualizar_usuario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', userId: idUsuario })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// =====================================================
// SOLICITUDES DE JUSTIFICANTES
// =====================================================

// Método: Obtener solicitudes de justificantes
BD.obtenerSolicitudesJustificante = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/solicitudes_justificacion.php`);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        return [];
    }
};

// Método: Crear nueva solicitud de justificante
BD.crearSolicitudJustificante = async function (datosSolicitud) {
    try {
        const respuesta = await fetch(`${this.URL_API}/solicitudes_justificacion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...datosSolicitud })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Aprobar solicitud de justificante
BD.aprobarSolicitudJustificante = async function (id, respuestaAdmin) {
    try {
        const respuesta = await fetch(`${this.URL_API}/solicitudes_justificacion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve', id, adminResponse: respuestaAdmin })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Rechazar solicitud de justificante
BD.rechazarSolicitudJustificante = async function (id, respuestaAdmin) {
    try {
        const respuesta = await fetch(`${this.URL_API}/solicitudes_justificacion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject', id, adminResponse: respuestaAdmin })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Agregar alias al objeto DB
DB.getJustificationRequests = () => BD.obtenerSolicitudesJustificante();
DB.createJustificationRequest = (d) => BD.crearSolicitudJustificante(d);
DB.approveJustificationRequest = (id, resp) => BD.aprobarSolicitudJustificante(id, resp);
DB.rejectJustificationRequest = (id, resp) => BD.rechazarSolicitudJustificante(id, resp);

// ============================================
// GESTIÓN DE GRUPOS (RF-2)
// ============================================

// Método: Obtener todos los grupos
BD.obtenerGrupos = async function (filtros = {}) {
    try {
        let url = `${this.URL_API}/grupos.php`;
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += '?' + params.toString();

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        return [];
    }
};

// Método: Crear grupo
BD.crearGrupo = async function (datosGrupo) {
    try {
        const respuesta = await fetch(`${this.URL_API}/grupos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...datosGrupo })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear grupo:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Actualizar grupo
BD.actualizarGrupo = async function (id, datosGrupo) {
    try {
        const respuesta = await fetch(`${this.URL_API}/grupos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', id, ...datosGrupo })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Eliminar grupo
BD.eliminarGrupo = async function (id) {
    try {
        const respuesta = await fetch(`${this.URL_API}/grupos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar grupo:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Asignar docente a grupo (RF-3)
BD.asignarDocenteAGrupo = async function (groupId, teacherId, teacherName) {
    try {
        const respuesta = await fetch(`${this.URL_API}/grupos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'assignTeacher', groupId, teacherId, teacherName })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al asignar docente:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Agregar alumno a grupo
BD.agregarAlumnoAGrupo = async function (groupId, studentId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/grupos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addStudent', groupId, studentId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al agregar alumno:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias para grupos
DB.getGroups = (f) => BD.obtenerGrupos(f);
DB.createGroup = (d) => BD.crearGrupo(d);
DB.updateGroup = (id, d) => BD.actualizarGrupo(id, d);
DB.deleteGroup = (id) => BD.eliminarGrupo(id);
DB.assignTeacherToGroup = (gId, tId, tName) => BD.asignarDocenteAGrupo(gId, tId, tName);
DB.addStudentToGroup = (gId, sId) => BD.agregarAlumnoAGrupo(gId, sId);

// ============================================
// GESTIÓN DE MATERIAS (RF-15)
// ============================================

// Método: Obtener todas las materias
BD.obtenerMaterias = async function (filtros = {}) {
    try {
        let url = `${this.URL_API}/materias.php`;
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += '?' + params.toString();

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener materias:', error);
        return [];
    }
};

// Método: Crear materia
BD.crearMateria = async function (datosMateria) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...datosMateria })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Actualizar materia
BD.actualizarMateria = async function (id, datosMateria) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', id, ...datosMateria })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al actualizar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Eliminar materia
BD.eliminarMateria = async function (id) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias para materias
DB.getSubjects = (f) => BD.obtenerMaterias(f);
DB.createSubject = (d) => BD.crearMateria(d);
DB.updateSubject = (id, d) => BD.actualizarMateria(id, d);
DB.deleteSubject = (id) => BD.eliminarMateria(id);

// ============================================
// REGISTRO DE ASISTENCIA (RF-5)
// ============================================

// Método: Obtener registros de asistencia
BD.obtenerAsistencia = async function (filtros = {}) {
    try {
        let url = `${this.URL_API}/asistencias.php`;
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += '?' + params.toString();

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener asistencia:', error);
        return [];
    }
};

// Método: Registrar asistencia de un grupo
BD.registrarAsistencia = async function (groupId, date, records, teacherId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/asistencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', groupId, date, records, teacherId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Obtener estadísticas de asistencia
BD.obtenerEstadisticasAsistencia = async function (filtros = {}) {
    try {
        const respuesta = await fetch(`${this.URL_API}/asistencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getStats', ...filtros })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return { total: 0, presente: 0, ausente: 0, tardanza: 0, justificado: 0 };
    }
};

// Alias para asistencia
DB.getAttendance = (f) => BD.obtenerAsistencia(f);
DB.registerAttendance = (gId, date, records, tId) => BD.registrarAsistencia(gId, date, records, tId);
DB.getAttendanceStats = (f) => BD.obtenerEstadisticasAsistencia(f);

// ============================================
// INSCRIPCIONES UNIVERSITARIAS (RF-9, RF-10)
// ============================================

// Método: Obtener inscripciones de un estudiante
BD.obtenerInscripciones = async function (studentId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/inscripciones.php?studentId=${studentId}`);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener inscripciones:', error);
        return [];
    }
};

// Método: Inscribirse a materia (RF-9)
BD.inscribirseAMateria = async function (datosInscripcion) {
    try {
        const respuesta = await fetch(`${this.URL_API}/inscripciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'enroll', ...datosInscripcion })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al inscribirse:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Dar de baja materia (RF-10)
BD.darDeBajaMateria = async function (enrollmentId, reason) {
    try {
        const respuesta = await fetch(`${this.URL_API}/inscripciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'drop', enrollmentId, reason })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al dar de baja:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias para inscripciones
DB.getEnrollments = (sId) => BD.obtenerInscripciones(sId);
DB.enrollSubject = (d) => BD.inscribirseAMateria(d);
DB.dropSubject = (eId, r) => BD.darDeBajaMateria(eId, r);

// ============================================
// SISTEMA DE NOTIFICACIONES (RF-13)
// ============================================

// Método: Obtener notificaciones de un usuario
BD.obtenerNotificaciones = async function (userId, soloNoLeidas = false) {
    try {
        let url = `${this.URL_API}/notificaciones.php?userId=${userId}`;
        if (soloNoLeidas) url += '&unread=true';

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return [];
    }
};

// Método: Crear notificación
BD.crearNotificacion = async function (datosNotificacion) {
    try {
        const respuesta = await fetch(`${this.URL_API}/notificaciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...datosNotificacion })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear notificación:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Marcar notificación como leída
BD.marcarNotificacionLeida = async function (notificationId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/notificaciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'markRead', notificationId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al marcar notificación:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Marcar todas como leídas
BD.marcarTodasLeidas = async function (userId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/notificaciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'markAllRead', userId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias para notificaciones
DB.getNotifications = (uId, unread) => BD.obtenerNotificaciones(uId, unread);
DB.createNotification = (d) => BD.crearNotificacion(d);
DB.markNotificationRead = (nId) => BD.marcarNotificacionLeida(nId);
DB.markAllNotificationsRead = (uId) => BD.marcarTodasLeidas(uId);

// ============================================
// GESTIÓN DE INCIDENCIAS (RF-3, RF-7)
// ============================================

// Método: Obtener incidencias
BD.obtenerIncidencias = async function (filtros = {}) {
    try {
        let url = `${this.URL_API}/incidencias.php`;
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += '?' + params.toString();

        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener incidencias:', error);
        return [];
    }
};

// Método: Crear incidencia (RF-7 - Docente)
BD.crearIncidencia = async function (datosIncidencia) {
    try {
        const respuesta = await fetch(`${this.URL_API}/incidencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...datosIncidencia })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear incidencia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Revisar incidencia (RF-3 - Admin)
BD.revisarIncidencia = async function (id, adminResponse, status = 'revisada') {
    try {
        const respuesta = await fetch(`${this.URL_API}/incidencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'review', id, adminResponse, status })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al revisar incidencia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Aplicar sanción (RF-3 - Admin)
BD.aplicarSancion = async function (id, sanctionData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/incidencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'applySanction', id, ...sanctionData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al aplicar sanción:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Obtener estadísticas de incidencias
BD.obtenerEstadisticasIncidencias = async function (filtros = {}) {
    try {
        const respuesta = await fetch(`${this.URL_API}/incidencias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getStats', ...filtros })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return { total: 0, conducta: 0, retardo: 0, falta: 0 };
    }
};

// Alias para incidencias
DB.getIncidents = (f) => BD.obtenerIncidencias(f);
DB.createIncident = (d) => BD.crearIncidencia(d);
DB.reviewIncident = (id, resp, status) => BD.revisarIncidencia(id, resp, status);
DB.applySanction = (id, data) => BD.aplicarSancion(id, data);
DB.getIncidentStats = (f) => BD.obtenerEstadisticasIncidencias(f);

// ============================================
// RF-15: Gestión de Materias
// ============================================

// Método: Obtener materias
BD.obtenerMaterias = async function (level = null) {
    try {
        let url = `${this.URL_API}/materias.php`;
        if (level) url += `?level=${level}`;
        const respuesta = await fetch(url);
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener materias:', error);
        return [];
    }
};

// Método: Crear materia
BD.crearMateria = async function (subjectData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...subjectData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Actualizar materia
BD.actualizarMateria = async function (subjectData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', ...subjectData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al actualizar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Eliminar materia
BD.eliminarMateria = async function (id) {
    try {
        const respuesta = await fetch(`${this.URL_API}/materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias en inglés para materias
DB.getSubjects = (level) => BD.obtenerMaterias(level);
DB.createSubject = (data) => BD.crearMateria(data);
DB.updateSubject = (data) => BD.actualizarMateria(data);
DB.deleteSubject = (id) => BD.eliminarMateria(id);

// ============================================
// RF-9: Actualización de perfil de alumno
// ============================================
BD.actualizarPerfil = async function (userId, profileData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/actualizar_perfil.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...profileData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return { success: false, error: 'Error de conexión' };
    }
};
DB.updateProfile = (userId, data) => BD.actualizarPerfil(userId, data);

// ============================================
// RF-13: Recuperación de contraseña
// ============================================
BD.solicitarRecuperacion = async function (email) {
    try {
        const respuesta = await fetch(`${this.URL_API}/recuperar_contrasena.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'request', email })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.validarTokenRecuperacion = async function (token) {
    try {
        const respuesta = await fetch(`${this.URL_API}/recuperar_contrasena.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'validate', token })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al validar token:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.resetearContrasena = async function (token, newPassword) {
    try {
        const respuesta = await fetch(`${this.URL_API}/recuperar_contrasena.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset', token, newPassword })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias en inglés
DB.requestPasswordRecovery = (email) => BD.solicitarRecuperacion(email);
DB.validateRecoveryToken = (token) => BD.validarTokenRecuperacion(token);
DB.resetPassword = (token, pw) => BD.resetearContrasena(token, pw);

// ============================================
// RF-5: Asignación de Materias a Docentes
// RN-1: Validación de Carga Mínima Docente
// RN-4: Gestión de Vacantes
// ============================================

// Método: Obtener lista de docentes con su carga de materias
BD.obtenerAsignacionesMaterias = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/asignar_materias.php?action=list`);
        const data = await respuesta.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return [];
    }
};

// Método: Obtener carga de un docente específico
BD.obtenerCargaDocente = async function (teacherId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/asignar_materias.php?action=teacherLoad&teacherId=${teacherId}`);
        const data = await respuesta.json();
        return data.success ? data.data : { count: 0, subjects: [], meetsMinimum: false };
    } catch (error) {
        console.error('Error al obtener carga docente:', error);
        return { count: 0, subjects: [], meetsMinimum: false };
    }
};

// Método: Obtener materias vacantes (sin docente asignado) - RN-4
BD.obtenerVacantes = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/asignar_materias.php?action=vacancies`);
        const data = await respuesta.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error al obtener vacantes:', error);
        return [];
    }
};

// Método: Asignar materia a docente
BD.asignarMateriaADocente = async function (teacherId, subjectId, subjectName) {
    try {
        const respuesta = await fetch(`${this.URL_API}/asignar_materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'assign', teacherId, subjectId, subjectName })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al asignar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Desasignar materia de docente
BD.desasignarMateriaDeDocente = async function (assignmentId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/asignar_materias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unassign', assignmentId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al desasignar materia:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias en inglés para RF-5
DB.getTeacherSubjectAssignments = () => BD.obtenerAsignacionesMaterias();
DB.getTeacherLoad = (teacherId) => BD.obtenerCargaDocente(teacherId);
DB.getVacancies = () => BD.obtenerVacantes();
DB.assignSubjectToTeacher = (tId, sId, sName) => BD.asignarMateriaADocente(tId, sId, sName);
DB.unassignSubjectFromTeacher = (aId) => BD.desasignarMateriaDeDocente(aId);

// ============================================
// RN-5: Bajas Temporales
// ============================================

// Método: Dar de baja temporal a un usuario (conserva boleta)
BD.bajaTemporal = async function (userId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/actualizar_usuario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'temporary_leave', userId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al dar baja temporal:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Método: Reincorporar usuario de baja temporal
BD.reincorporar = async function (userId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/actualizar_usuario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reincorporate', userId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al reincorporar usuario:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias en inglés para RN-5
DB.temporaryLeave = (userId) => BD.bajaTemporal(userId);
DB.reincorporate = (userId) => BD.reincorporar(userId);

// ============================================
// RF-2: Talleres y Optativas
// ============================================

BD.obtenerTalleres = async function (level = null) {
    try {
        let url = `${this.URL_API}/talleres.php?action=list`;
        if (level) url += `&level=${level}`;
        const respuesta = await fetch(url);
        const data = await respuesta.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error al obtener talleres:', error);
        return [];
    }
};

BD.crearTaller = async function (workshopData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/talleres.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...workshopData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear taller:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.toggleTaller = async function (workshopId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/talleres.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle', workshopId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al cambiar estado del taller:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.eliminarTaller = async function (workshopId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/talleres.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', workshopId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar taller:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.verificarTaller = async function (workshopId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/talleres.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', workshopId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al verificar taller:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias en inglés
DB.getWorkshops = (level) => BD.obtenerTalleres(level);
DB.createWorkshop = (data) => BD.crearTaller(data);
DB.toggleWorkshop = (id) => BD.toggleTaller(id);
DB.deleteWorkshop = (id) => BD.eliminarTaller(id);
DB.verifyWorkshop = (id) => BD.verificarTaller(id);

// ============================================
// RN-2/RN-3: Preferencias Docentes
// ============================================

BD.obtenerPreferenciasDocentes = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/preferencias_docentes.php?action=list`);
        const data = await respuesta.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error al obtener preferencias:', error);
        return [];
    }
};

BD.guardarPreferenciaDocente = async function (teacherId, preferences) {
    try {
        const respuesta = await fetch(`${this.URL_API}/preferencias_docentes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', teacherId, ...preferences })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.establecerAntiguedad = async function (teacherId, seniority) {
    try {
        const respuesta = await fetch(`${this.URL_API}/preferencias_docentes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setSeniority', teacherId, seniority })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al establecer antigüedad:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.asignacionAutomatica = async function (subjectId, subjectName) {
    try {
        const respuesta = await fetch(`${this.URL_API}/preferencias_docentes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'autoAssign', subjectId, subjectName })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error en asignación automática:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias
DB.getTeacherPreferences = () => BD.obtenerPreferenciasDocentes();
DB.saveTeacherPreference = (id, prefs) => BD.guardarPreferenciaDocente(id, prefs);
DB.setSeniority = (id, years) => BD.establecerAntiguedad(id, years);
DB.autoAssignSubject = (sId, sName) => BD.asignacionAutomatica(sId, sName);

// ============================================
// RN-25: Calendario SEP
// ============================================

BD.obtenerCalendario = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/calendario.php?action=full`);
        const data = await respuesta.json();
        return data.success ? data.data : {};
    } catch (error) {
        console.error('Error al obtener calendario:', error);
        return {};
    }
};

BD.agregarDiaFestivo = async function (date, name, type = 'custom') {
    try {
        const respuesta = await fetch(`${this.URL_API}/calendario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addHoliday', date, name, type })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al agregar día festivo:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.eliminarDiaFestivo = async function (holidayId) {
    try {
        const respuesta = await fetch(`${this.URL_API}/calendario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'removeHoliday', holidayId })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al eliminar día festivo:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.agregarPeriodo = async function (periodData) {
    try {
        const respuesta = await fetch(`${this.URL_API}/calendario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addPeriod', ...periodData })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al agregar período:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.importarCalendarioSEP = async function (year) {
    try {
        const respuesta = await fetch(`${this.URL_API}/calendario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'importSEP', year })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al importar calendario SEP:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

// Alias
DB.getCalendar = () => BD.obtenerCalendario();
DB.addHoliday = (d, n, t) => BD.agregarDiaFestivo(d, n, t);
DB.removeHoliday = (id) => BD.eliminarDiaFestivo(id);
DB.addPeriod = (data) => BD.agregarPeriodo(data);
DB.importSEPCalendar = (year) => BD.importarCalendarioSEP(year);

// ============================================
// RN-1 (Admin): Mantenimiento del Sistema
// ============================================

BD.obtenerEstadoSistema = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/mantenimiento.php?action=status`);
        const data = await respuesta.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.error('Error al obtener estado del sistema:', error);
        return null;
    }
};

BD.obtenerLogs = async function (type = null, limit = 50) {
    try {
        let url = `${this.URL_API}/mantenimiento.php?action=logs&limit=${limit}`;
        if (type) url += `&type=${type}`;
        const respuesta = await fetch(url);
        const data = await respuesta.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error al obtener logs:', error);
        return [];
    }
};

BD.limpiarLogs = async function (type = null) {
    try {
        const respuesta = await fetch(`${this.URL_API}/mantenimiento.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clearLogs', type })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al limpiar logs:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.crearBackup = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/mantenimiento.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'backup' })
        });
        return await respuesta.json();
    } catch (error) {
        console.error('Error al crear backup:', error);
        return { success: false, error: 'Error de conexión' };
    }
};

BD.verificarSalud = async function () {
    try {
        const respuesta = await fetch(`${this.URL_API}/mantenimiento.php?action=health`);
        const data = await respuesta.json();
        return data;
    } catch (error) {
        console.error('Error en health check:', error);
        return { success: false, healthy: false };
    }
};

// Alias
DB.getSystemStatus = () => BD.obtenerEstadoSistema();
DB.getLogs = (type, limit) => BD.obtenerLogs(type, limit);
DB.clearLogs = (type) => BD.limpiarLogs(type);
DB.createBackup = () => BD.crearBackup();
DB.healthCheck = () => BD.verificarSalud();

