// Datos de Temas 
const THEMES = {
    'Kinder': { primary: '#D32F2F', secondary: '#4ECDC4', bgSoft: '#FFF0F0' },
    'Primaria': { primary: '#168f1eff', secondary: '#F1C40F', bgSoft: '#E8F6E8' },
    'Secundaria': { primary: '#4D44B5', secondary: '#FCC43E', bgSoft: '#F3F6FF' },
    'Universidad': { primary: '#2C3E50', secondary: '#E74C3C', bgSoft: '#F4F6F7' }
};

// Elementos del DOM
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const toastEl = document.getElementById('toast');

// Elementos del Panel de Control
const sidebarNav = document.getElementById('sidebar-nav');
const userNameDisplay = document.getElementById('user-name');
const userRoleDisplay = document.getElementById('user-role');
const userAvatar = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');
const mainContainer = document.getElementById('main-container');
const pageTitle = document.getElementById('page-title');

// Inicializar Aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si existe una sesión activa
    const user = Auth.init();
    if (user) {
        renderDashboard(user);
    } else {
        showLogin();
    }

    // Toggle de visibilidad de contraseña
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');

    if (togglePasswordBtn && passwordInput && passwordIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordIcon.classList.toggle('fa-eye', !isPassword);
            passwordIcon.classList.toggle('fa-eye-slash', isPassword);
        });
    }


    // Manejador de Inicio de Sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        const result = await Auth.login(username, password);
        if (result.success) {
            showToast(`Bienvenido, ${result.user.name}`, 'success');
            renderDashboard(result.user);
        } else {
            showToast(result.error || 'Error al iniciar sesión', 'error');
        }
    });

    // RF-13: Manejador de Olvidé mi Contraseña (Real con tokens)
    const forgotPasswordLink = document.querySelector('a.text-accent');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            showPasswordRecoveryModal();
        });
    }

    // Manejador de Cierre de Sesión
    logoutBtn.addEventListener('click', () => {
        Auth.logout('Cierre de sesión manual');
    });

    // Escuchar Eventos de Autenticación
    window.addEventListener('auth:logout', (e) => {
        const reason = e.detail.reason;
        if (reason) showToast(reason, 'warning');
        showLogin();
    });
});

// Cambio de Vistas
function showLogin() {
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginForm.reset();
}

function renderDashboard(user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    // Actualizar Encabezado
    userNameDisplay.textContent = user.name;
    userRoleDisplay.textContent = user.level ? `${getRoleName(user.role)} - ${user.level}` : getRoleName(user.role);
    userAvatar.textContent = user.name.charAt(0).toUpperCase();

    // Renderizar Menú basado en Rol
    renderMenu(user.role, user);

    // Renderizar Contenido de Bienvenida por defecto
    // Aplicar Tema basado en el Nivel del Usuario si es estudiante, o predeterminado
    if (user.role === ROLES.ALUMNO && user.level) {
        applyTheme(user.level);
    } else {
        // Restablecer tema predeterminado
        const root = document.documentElement;
        root.style.setProperty('--primary-color', '#0F172A');
        root.style.setProperty('--accent-color', '#38BDF8');
    }
    renderContent('home');
}

// Funciones Auxiliares
function applyTheme(levelName) {
    const theme = THEMES[levelName] || THEMES['Universidad'];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--accent-color', theme.secondary);
}

function showToast(msg, type = 'info') {
    toastEl.textContent = msg;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}

function getRoleName(role) {
    const map = {
        [ROLES.ADMIN]: 'Administrador',
        [ROLES.DOCENTE]: 'Docente',
        [ROLES.ALUMNO]: 'Estudiante',
        [ROLES.TUTOR]: 'Padre/Tutor'
    };
    return map[role] || role;
}

function renderMenu(role, user) {
    sidebarNav.innerHTML = '';
    const menuItems = getMenuItems(role, user);

    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-item';
        link.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            link.classList.add('active');
            renderContent(item.id, user); // Pass user for context logic
        });
        sidebarNav.appendChild(link);
    });
}

function getMenuItems(role, user) {
    const common = [
        { id: 'home', label: 'Inicio', icon: 'fa-solid fa-home' }
    ];

    const roleSpecific = {
        [ROLES.ADMIN]: [
            { id: 'users', label: 'Usuarios (RF-1)', icon: 'fa-solid fa-users' },
            { id: 'groups', label: 'Grupos (RF-2)', icon: 'fa-solid fa-users-rectangle' },
            { id: 'subjects', label: 'Materias (RF-15)', icon: 'fa-solid fa-book' },
            { id: 'assign-subjects', label: 'Asignar Materias (RF-5)', icon: 'fa-solid fa-link' },
            { id: 'vacancies', label: 'Vacantes (RN-4)', icon: 'fa-solid fa-user-xmark' },
            { id: 'workshops', label: 'Talleres (RF-2)', icon: 'fa-solid fa-palette' },
            { id: 'teacher-prefs', label: 'Pref. Docentes (RN-2)', icon: 'fa-solid fa-user-gear' },
            { id: 'admin-subject-enrollment', label: 'Inscribir Materias', icon: 'fa-solid fa-book-open' },
            { id: 'reports', label: 'Reportes (RF-17)', icon: 'fa-solid fa-chart-bar' },
            { id: 'incidents-admin', label: 'Incidencias (RF-3)', icon: 'fa-solid fa-exclamation-triangle' },
            { id: 'absences', label: 'Solicitudes Justif.', icon: 'fa-solid fa-clipboard-check' },
            { id: 'enrollment', label: 'Inscripción (RF-4)', icon: 'fa-solid fa-user-plus' },
            { id: 'calendar-admin', label: 'Calendario SEP (RN-25)', icon: 'fa-solid fa-calendar-alt' },
            { id: 'maintenance', label: 'Mantenimiento', icon: 'fa-solid fa-wrench' }
        ],
        [ROLES.DOCENTE]: [
            { id: 'my-groups', label: 'Mis Grupos (RF-8)', icon: 'fa-solid fa-chalkboard-user' },
            { id: 'attendance', label: 'Asistencia (RF-5)', icon: 'fa-solid fa-clipboard-user' },
            { id: 'grades', label: 'Capturar Calif. (RF-6)', icon: 'fa-solid fa-marker' },
            { id: 'incidents', label: 'Incidencias (RF-7)', icon: 'fa-solid fa-exclamation-circle' }
        ],
        [ROLES.ALUMNO]: [
            { id: 'schedule', label: 'Horario (RF-11)', icon: 'fa-solid fa-calendar-days' },
            { id: 'my-subjects', label: 'Mis Materias', icon: 'fa-solid fa-book-open' },
            { id: 'grades-view', label: 'Calificaciones', icon: 'fa-solid fa-star' },
            { id: 'request-justification', label: 'Solicitar Justificante', icon: 'fa-solid fa-file-medical' }
        ],
        [ROLES.TUTOR]: [
            { id: 'children', label: 'Estudiantes', icon: 'fa-solid fa-child' }
        ]
    };

    // University students can enroll in subjects (RF-9) and edit profile
    if (role === ROLES.ALUMNO && user.level === 'Universidad') {
        roleSpecific[ROLES.ALUMNO].push({ id: 'univ-enrollment', label: 'Inscribir Materias', icon: 'fa-solid fa-book-open' });
        roleSpecific[ROLES.ALUMNO].push({ id: 'profile', label: 'Mi Perfil (RF-9)', icon: 'fa-solid fa-user-pen' });
    }

    // RN-6: Tutor privileges restriction
    if (role === ROLES.TUTOR) {
        // If all students are >= Preparatoria, Tutor is only emergency contact (RN-6)
        // Check local storage or logic? For demo, we assume mixed or verify on click
        // But the menu item 'Estudiantes' is valid for viewing (RF-12 says "Hasta Secundaria")
        // So we might hide 'children' if all are older?
        // Use generic list for now, validtion inside.
    }

    return [...common, ...(roleSpecific[role] || [])];
}

// Enrutador Simple / Renderizador de Contenido
function renderContent(viewId, user = Auth.currentUser) {
    pageTitle.textContent = viewId === 'home' ? 'Inicio' : 'Gestión';

    // Limpiar Contenedor
    mainContainer.innerHTML = '';

    // Lógica de Renderizado basada en ID de Vista
    switch (viewId) {
        case 'home':
            renderHomeDashboard();
            break;

        case 'users':
            renderUserList();
            break;

        case 'reports':
            renderReports();
            break;

        case 'absences':
            renderAbsences();
            break;

        case 'enrollment':
            renderAdminEnrollment(); // New Admin Enrollment
            break;

        case 'grades':
            renderGrades();
            break;

        case 'schedule':
            renderStudentSchedule(); // Updated with RN-11/12
            break;

        case 'grades-view':
            renderStudentGrades();
            break;

        case 'univ-enrollment':
            renderUnivEnrollment(user); // RF-9
            break;

        case 'my-subjects':
            renderMySubjects(user); // View enrolled subjects for all students
            break;

        case 'request-justification':
            renderRequestJustification(user);
            break;

        case 'groups':
            renderGroups();
            break;

        case 'subjects':
            renderSubjects();
            break;

        case 'admin-subject-enrollment':
            renderAdminSubjectEnrollment();
            break;

        case 'attendance':
            renderAttendance(user);
            break;

        case 'my-groups':
            renderMyGroups(user);
            break;

        case 'children':
            renderTutorChildren(user); // Updated with RN-6/7
            break;

        case 'incidents':
            renderIncidencias(user); // RF-7: Docente registra incidencias
            break;

        case 'incidents-admin':
            renderAdminIncidencias(); // RF-3: Admin gestiona incidencias
            break;

        case 'profile':
            renderStudentProfile(user); // RF-9: Perfil de alumno universitario
            break;

        case 'assign-subjects':
            renderAssignSubjects(); // RF-5: Asignar materias a docentes
            break;

        case 'vacancies':
            renderVacancies(); // RN-4: Materias sin docente
            break;

        case 'workshops':
            renderWorkshops(); // RF-2: Talleres y optativas
            break;

        case 'teacher-prefs':
            renderTeacherPreferences(); // RN-2/RN-3: Preferencias docentes
            break;

        case 'calendar-admin':
            renderAdminCalendar(); // RN-25: Calendario SEP
            break;

        case 'maintenance':
            renderMaintenance(); // RN-1: Mantenimiento del sistema
            break;

        default:
            mainContainer.innerHTML = `
                <div class="card">
                    <h3>En Construcción</h3>
                    <p>El módulo <strong>${viewId}</strong> está en desarrollo.</p>
                </div>
            `;
    }
}
window.renderContent = renderContent;

// ... (Existing code above) ...

// Funcionalidad Admin: Listar Usuarios (CU-005)
async function renderUserList() {
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando usuarios...</div>';
    const users = await DB.getUsers();
    pageTitle.textContent = 'Lista de Usuarios (RF-1)';

    let html = `
        <div class="card">
            <h3>Usuarios Registrados</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario/ID</th>
                            <th>Rol</th>
                            <th>Nivel</th>
                            <th>Año Nac.</th>
                            <th>Email</th>
                            <th>Estatus</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    users.forEach(u => {
        // Determinar color del estatus (incluye baja_temporal para RN-5)
        let claseEstatus, textoEstatus;
        const esActivo = u.status === 'active';
        const esBajaTemporal = u.status === 'baja_temporal';

        if (esActivo) {
            claseEstatus = 'text-success';
            textoEstatus = 'ACTIVO';
        } else if (esBajaTemporal) {
            claseEstatus = 'text-warning';
            textoEstatus = 'BAJA TEMPORAL';
        } else {
            claseEstatus = 'text-error';
            textoEstatus = 'INACTIVO';
        }

        // Obtener año de nacimiento si existe email con formato estándar
        let anoNacimiento = '-';
        if (u.email) {
            // Intentar extraer año del email (formato: inicialApellido+mes+año@...)
            const matchAno = u.email.match(/(\d{4})@/);
            if (matchAno) {
                anoNacimiento = matchAno[1];
            }
        }

        // Obtener nivel académico
        const nivel = u.level || '-';

        // Verificar si es administrador (no se puede eliminar ni desactivar)
        const esAdmin = u.role === 'admin';
        const esAlumno = u.role === 'alumno';

        // Generar botones de acción solo si NO es admin
        let botonesAccion = '';
        if (esAdmin) {
            botonesAccion = `<span class="text-muted text-xs">Protegido</span>`;
        } else {
            botonesAccion = `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">`;

            // Botón de activar/desactivar (solo si NO está en baja temporal)
            if (!esBajaTemporal) {
                const textoBotonEstatus = esActivo ? 'Desactivar' : 'Activar';
                const claseBotonEstatus = esActivo ? 'btn-warning' : 'btn-success';
                botonesAccion += `
                    <button class="btn btn-sm ${claseBotonEstatus} btn-toggle-status" data-id="${u.id}" title="${textoBotonEstatus}">
                        <i class="fa-solid ${esActivo ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                `;
            }

            // RN-5: Botón de Baja Temporal (solo para alumnos activos)
            if (esAlumno && esActivo) {
                botonesAccion += `
                    <button class="btn btn-sm btn-temp-leave" data-id="${u.id}" data-name="${u.name}" title="Baja Temporal (RN-5)" style="background: #f97316; color: white;">
                        <i class="fa-solid fa-pause"></i>
                    </button>
                `;
            }

            // RN-5: Botón de Reincorporar (solo para usuarios en baja temporal)
            if (esBajaTemporal) {
                botonesAccion += `
                    <button class="btn btn-sm btn-success btn-reincorporate" data-id="${u.id}" data-name="${u.name}" title="Reincorporar (RN-5)">
                        <i class="fa-solid fa-play"></i> Reincorporar
                    </button>
                `;
            }

            // Botón eliminar (no para usuarios en baja temporal - deben reincorporarse o seguir en baja)
            if (!esBajaTemporal) {
                botonesAccion += `
                    <button class="btn btn-sm btn-danger btn-delete-user" data-id="${u.id}" data-name="${u.name}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            }

            botonesAccion += `</div>`;
        }

        html += `
            <tr data-user-id="${u.id}">
                <td class="font-bold">${u.name}</td>
                <td class="text-muted">${u.username}</td>
                <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${getRoleName(u.role)}</span></td>
                <td>${nivel}</td>
                <td>${anoNacimiento}</td>
                <td>${u.email || '-'}</td>
                <td><span class="${claseEstatus} font-bold" style="font-size: 0.8rem;">${textoEstatus}</span></td>
                <td>${botonesAccion}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Agregar eventos a botones de cambiar estatus
    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-id');
            const resultado = await DB.toggleUserStatus(userId);
            if (resultado.success) {
                showToast(`Estatus cambiado a ${resultado.newStatus.toUpperCase()}`, 'success');
                renderUserList(); // Recargar tabla
            } else {
                showToast('Error al cambiar estatus: ' + resultado.error, 'error');
            }
        });
    });

    // Agregar eventos a botones de eliminar
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-id');
            const userName = btn.getAttribute('data-name');

            if (confirm(`¿Estás seguro de eliminar al usuario "${userName}"?\n\nEsta acción no se puede deshacer.`)) {
                const resultado = await DB.deleteUser(userId);
                if (resultado.success) {
                    showToast(`Usuario "${userName}" eliminado`, 'success');
                    renderUserList(); // Recargar tabla
                } else {
                    showToast('Error al eliminar: ' + resultado.error, 'error');
                }
            }
        });
    });

    // RN-5: Agregar eventos a botones de baja temporal
    document.querySelectorAll('.btn-temp-leave').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-id');
            const userName = btn.getAttribute('data-name');

            if (confirm(`¿Registrar baja temporal para "${userName}"?\n\nRN-5: La boleta se conservará para una futura reincorporación.`)) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                const resultado = await DB.temporaryLeave(userId);
                if (resultado.success) {
                    showToast(`Baja temporal registrada. Boleta conservada: ${resultado.boleta}`, 'success');
                    renderUserList();
                } else {
                    showToast('Error: ' + resultado.error, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                }
            }
        });
    });

    // RN-5: Agregar eventos a botones de reincorporar
    document.querySelectorAll('.btn-reincorporate').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-id');
            const userName = btn.getAttribute('data-name');

            if (confirm(`¿Reincorporar a "${userName}"?\n\nRN-5: Se usará la misma boleta original.`)) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                const resultado = await DB.reincorporate(userId);
                if (resultado.success) {
                    showToast(`Usuario reincorporado. Boleta: ${resultado.boleta}`, 'success');
                    renderUserList();
                } else {
                    showToast('Error: ' + resultado.error, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-play"></i> Reincorporar';
                }
            }
        });
    });
}

// Funcionalidad Estudiante: Inscripción Administrativa (RF-4, RN-20, RN-15, RN-10)
function renderAdminEnrollment() {
    pageTitle.textContent = 'Inscripción Administrativa (RF-4)';

    mainContainer.innerHTML = `
        <div class="card" style="max-width: 700px; margin: 0 auto;">
            <!-- Tabs de navegación -->
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem;">
                <button class="btn btn-primary tab-btn active" data-tab="alumno">
                    <i class="fa-solid fa-user-graduate"></i> Alumno
                </button>
                <button class="btn btn-secondary tab-btn" data-tab="docente">
                    <i class="fa-solid fa-chalkboard-user"></i> Docente
                </button>
                <button class="btn btn-secondary tab-btn" data-tab="tutor">
                    <i class="fa-solid fa-users"></i> Padre/Tutor
                </button>
            </div>

            <!-- Contenedor de formularios -->
            <div id="enrollment-forms">
                <!-- Formulario Alumno (visible por defecto) -->
                <div id="form-alumno" class="enrollment-form">
                    <h3><i class="fa-solid fa-user-graduate"></i> Registrar Nuevo Alumno</h3>
                    <form id="enroll-student-form">
                        <label class="input-label">Nivel Educativo</label>
                        <select id="student-level" class="input-field">
                            <option value="Kinder">Kínder</option>
                            <option value="Primaria">Primaria</option>
                            <option value="Secundaria">Secundaria</option>
                            <option value="Universidad">Universidad</option>
                        </select>
                        
                        <label class="input-label">Nombre Completo</label>
                        <input type="text" id="student-name" class="input-field" placeholder="Nombre Apellidos" required>
                        
                        <label class="input-label">Fecha de Nacimiento</label>
                        <input type="date" id="student-dob" class="input-field" required>

                        <label class="input-label">Contraseña Inicial</label>
                        <input type="text" id="student-pass" class="input-field" value="Password1!" required>
                        <div class="text-xs text-muted mb-2">Mínimo 9 caracteres, mayúscula, minúscula, número y símbolo.</div>
                        
                        <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">
                            <i class="fa-solid fa-user-plus"></i> Registrar Alumno
                        </button>
                    </form>
                </div>

                <!-- Formulario Docente -->
                <div id="form-docente" class="enrollment-form hidden">
                    <h3><i class="fa-solid fa-chalkboard-user"></i> Registrar Nuevo Docente</h3>
                    <form id="enroll-teacher-form">
                        <label class="input-label">Nombre Completo</label>
                        <input type="text" id="teacher-name" class="input-field" placeholder="Nombre Apellidos" required>

                        <label class="input-label">Especialidad / Materias</label>
                        <input type="text" id="teacher-specialty" class="input-field" placeholder="Ej: Matemáticas, Física" required>

                        <label class="input-label">Contraseña Inicial</label>
                        <input type="text" id="teacher-pass" class="input-field" value="Password1!" required>
                        
                        <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">
                            <i class="fa-solid fa-user-plus"></i> Registrar Docente
                        </button>
                    </form>
                </div>

                <!-- Formulario Tutor/Padre -->
                <div id="form-tutor" class="enrollment-form hidden">
                    <h3><i class="fa-solid fa-users"></i> Registrar Nuevo Padre/Tutor</h3>
                    <form id="enroll-tutor-form">
                        <label class="input-label">Nombre Completo del Tutor</label>
                        <input type="text" id="tutor-name" class="input-field" placeholder="Nombre Apellidos" required>

                        <label class="input-label">Teléfono de Contacto</label>
                        <input type="tel" id="tutor-phone" class="input-field" placeholder="55 1234 5678">

                        <label class="input-label">Boleta del Estudiante (Hijo/a)</label>
                        <input type="text" id="tutor-student-id" class="input-field" placeholder="Ej: 2020640001" required>
                        <div class="text-xs text-muted mb-2">Ingrese la boleta del estudiante para vincular al tutor.</div>

                        <label class="input-label">Contraseña Inicial</label>
                        <input type="text" id="tutor-pass" class="input-field" value="Password1!" required>
                        
                        <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">
                            <i class="fa-solid fa-user-plus"></i> Registrar Tutor
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Lógica de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Cambiar estilos de tabs
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary', 'active');

            // Mostrar formulario correspondiente
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.enrollment-form').forEach(f => f.classList.add('hidden'));
            document.getElementById(`form-${tabId}`).classList.remove('hidden');
        });
    });

    // Formulario de Alumno
    document.getElementById('enroll-student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const level = document.getElementById('student-level').value;
        const dob = new Date(document.getElementById('student-dob').value);
        const name = document.getElementById('student-name').value.trim();
        const password = document.getElementById('student-pass').value;

        // Verificar periodo de inscripción
        const settings = await DB.getSettings();
        const isHigherLevel = ['Preparatoria', 'Universidad'].includes(level);
        const isBasicLevel = ['Kinder', 'Primaria', 'Secundaria'].includes(level);

        // Validar Básico (Bimestral)
        if (isBasicLevel) {
            if (settings.enrollmentPeriodBasic !== 'active') {
                showToast(`El periodo de inscripción para Nivel Básico (${level}) está CERRADO.`, 'error');
                return;
            }
        }

        // Validar Superior (Semestral)
        if (isHigherLevel) {
            if (settings.enrollmentPeriod !== 'active') {
                showToast(`El periodo de inscripción para Nivel Superior (${level}) está CERRADO.`, 'error');
                return;
            }
        }

        // Validar que el nombre solo contenga letras y espacios
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!nombreRegex.test(name)) {
            showToast('Error: El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        // Validar contraseña
        const passCheck = Auth.validatePassword(password);
        if (!passCheck.valid) {
            showToast(`Error: ${passCheck.error}`, 'error');
            return;
        }

        // Validar que la fecha de nacimiento no sea futura
        if (dob > new Date()) {
            showToast('Error: La fecha de nacimiento no puede ser una fecha futura.', 'error');
            return;
        }

        // Calcular edad
        const ageDifMs = Date.now() - dob.getTime();
        const age = Math.floor(ageDifMs / (1000 * 60 * 60 * 24 * 365.25));

        // Validar edad máxima (30 años)
        if (age > 30) {
            showToast('Error: La edad máxima para estudiantes es de 30 años.', 'error');
            return;
        }

        // Validar edad mínima y máxima según nivel
        let minAge = 0;
        let maxAge = 30;
        if (level === 'Kinder') { minAge = 4; maxAge = 6; }
        if (level === 'Primaria') { minAge = 5; maxAge = 12; }
        if (level === 'Secundaria') { minAge = 12; maxAge = 16; }
        if (level === 'Universidad') { minAge = 17; maxAge = 30; }

        if (age < minAge) {
            showToast(`Error: Edad mínima para ${level} es ${minAge} años. El estudiante tiene ${age}.`, 'error');
            return;
        }

        if (age > maxAge) {
            showToast(`Error: Edad máxima para ${level} es ${maxAge} años. El estudiante tiene ${age}.`, 'error');
            return;
        }

        // Generar email y boleta
        const parts = name.split(' ');
        const firstName = parts[0] || 'X';
        const lastName = parts[1] || 'X';
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const year = dob.getFullYear();
        const email = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}${month}${year}@schoolhub.edu.mx`;
        const boleta = `${new Date().getFullYear()}64${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        const newUser = {
            id: `ALU${Math.floor(Math.random() * 10000)}`,
            username: boleta,
            password: password,
            role: ROLES.ALUMNO,
            name: name,
            email: email,
            level: level,
            group: 'Sin Asignar',
            status: 'active'
        };

        const result = await DB.createUser(newUser);
        if (result.success) {
            showToast(`Alumno registrado. Boleta: ${boleta}`, 'success');
            renderContent('users');
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    });

    // Formulario de Docente
    document.getElementById('enroll-teacher-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('teacher-name').value.trim();
        const specialty = document.getElementById('teacher-specialty').value;
        const password = document.getElementById('teacher-pass').value;

        // Validar que el nombre solo contenga letras y espacios
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!nombreRegex.test(name)) {
            showToast('Error: El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        // Validar contraseña
        const passCheck = Auth.validatePassword(password);
        if (!passCheck.valid) {
            showToast(`Error: ${passCheck.error}`, 'error');
            return;
        }

        // Generar ID de empleado y email
        const empId = `E${Math.floor(100000 + Math.random() * 900000)}`;
        const parts = name.split(' ');
        const firstName = parts[0] || 'X';
        const lastName = parts[1] || 'X';
        const email = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@schoolhub.edu.mx`;

        const newUser = {
            id: `DOC${Math.floor(Math.random() * 10000)}`,
            username: empId,
            password: password,
            role: ROLES.DOCENTE,
            name: name,
            email: email,
            specialty: specialty,
            status: 'active'
        };

        const result = await DB.createUser(newUser);
        if (result.success) {
            showToast(`Docente registrado. ID: ${empId}, Email: ${email}`, 'success');
            renderContent('users');
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    });

    // Formulario de Tutor
    document.getElementById('enroll-tutor-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('tutor-name').value.trim();
        const phone = document.getElementById('tutor-phone').value;
        const studentBoleta = document.getElementById('tutor-student-id').value;
        const password = document.getElementById('tutor-pass').value;

        // Validar que el nombre solo contenga letras y espacios
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!nombreRegex.test(name)) {
            showToast('Error: El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        // Validar contraseña
        const passCheck = Auth.validatePassword(password);
        if (!passCheck.valid) {
            showToast(`Error: ${passCheck.error}`, 'error');
            return;
        }

        // Buscar estudiante por boleta
        const users = await DB.getUsers();
        const student = users.find(u => u.username === studentBoleta && u.role === 'alumno');

        if (!student) {
            showToast(`Error: No se encontró estudiante con boleta ${studentBoleta}`, 'error');
            return;
        }

        // Generar username y email para tutor
        const tutorUsername = name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100);
        const parts = name.split(' ');
        const firstName = parts[0] || 'X';
        const lastName = parts[1] || 'X';
        const email = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}.tutor@schoolhub.edu.mx`;

        const newUser = {
            id: `TUT${Math.floor(Math.random() * 10000)}`,
            username: tutorUsername,
            password: password,
            role: ROLES.TUTOR,
            name: name,
            email: email,
            phone: phone,
            students: [student.id],
            status: 'active'
        };

        const result = await DB.createUser(newUser);
        if (result.success) {
            showToast(`Tutor registrado. Email: ${email}`, 'success');
            renderContent('users');
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    });
}

// Funcionalidad Estudiante: Ver Mis Materias Inscritas (todos los niveles)
async function renderMySubjects(user) {
    pageTitle.textContent = 'Mis Materias Inscritas';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando materias...</div>';

    // Obtener inscripciones del alumno
    const myEnrollments = await DB.getEnrollments(user.id);
    const activeEnrollments = myEnrollments.filter(e => e.status === 'Inscrito');

    const levelColors = {
        'Kinder': '#ec4899',
        'Primaria': '#22c55e',
        'Secundaria': '#f59e0b',
        'Universidad': '#3b82f6'
    };

    const levelColor = levelColors[user.level] || '#3b82f6';

    let html = `
        <div class="card" style="border-top: 4px solid ${levelColor};">
            <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3><i class="fa-solid fa-book-open"></i> Mis Materias Inscritas</h3>
                <span style="background: ${levelColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">
                    ${user.level || 'Sin nivel'}
                </span>
            </div>
            
            ${activeEnrollments.length === 0 ? `
                <div class="text-center text-muted" style="padding: 3rem;">
                    <i class="fa-solid fa-book" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h4>No tienes materias inscritas</h4>
                    <p class="text-sm">Aún no te han inscrito en ninguna materia. Contacta a tu administrador.</p>
                </div>
            ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    ${activeEnrollments.map(e => `
                        <div class="card" style="margin: 0; background: var(--bg-secondary); border-left: 4px solid ${levelColor};">
                            <div class="flex justify-between items-start">
                                <h4 class="font-bold">${e.subjectName}</h4>
                                <span class="text-lg font-bold" style="color: ${levelColor};">${e.credits || 0}</span>
                            </div>
                            <p class="text-sm text-muted" style="margin-top: 0.25rem;">Créditos</p>
                            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                                <p class="text-xs text-muted">
                                    <i class="fa-solid fa-calendar"></i> 
                                    Inscrito: ${e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('es-MX') : '-'}
                                </p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>Resumen:</strong> ${activeEnrollments.length} materia(s) inscrita(s) | 
                    Total: ${activeEnrollments.reduce((acc, e) => acc + (e.credits || 0), 0)} créditos
                </div>
            `}
        </div>
    `;

    mainContainer.innerHTML = html;
}

// Funcionalidad Estudiante: Inscripción Universitaria (RF-9, RF-10, RN-12)
async function renderUnivEnrollment(user) {
    pageTitle.textContent = 'Inscripción de Materias (Universitaria)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando materias...</div>';

    // Obtener materias disponibles, inscripciones del alumno y estado del periodo
    const [allSubjects, myEnrollments, settings] = await Promise.all([
        DB.getSubjects({ level: 'Universidad' }),
        DB.getEnrollments(user.id),
        DB.getSettings()
    ]);

    // Verificar si el periodo de inscripción está activo (Universidad usa enrollmentPeriod)
    const periodoActivo = settings.enrollmentPeriod === 'active';

    // Filtrar materias de universidad (soporta ambas estructuras: level o levels)
    const subjects = allSubjects.filter(s => s.level === 'Universidad' || (s.levels || []).includes('Universidad'));
    const activeEnrollments = myEnrollments.filter(e => e.status === 'Inscrito');
    const enrolledSubjectIds = activeEnrollments.map(e => e.subjectId);

    let html = `
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3><i class="fa-solid fa-book-open"></i> Mis Materias Inscritas</h3>
            <p class="text-muted text-sm">Materias actualmente inscritas. Puede dar de baja antes de la semana 4 (RF-10).</p>
            
            ${myEnrollments.length === 0 ? '<p class="text-muted" style="margin-top: 1rem;">No tiene materias inscritas actualmente.</p>' : `
                <table style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Créditos</th>
                            <th>Fecha Inscripción</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${myEnrollments.map(e => `
                            <tr>
                                <td class="font-bold">${e.subjectName}</td>
                                <td>${e.credits || 0}</td>
                                <td class="text-sm text-muted">${e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('es-MX') : '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger btn-drop" data-id="${e.id}" data-name="${e.subjectName}">
                                        <i class="fa-solid fa-times"></i> Dar de Baja
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
            
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                <strong>Resumen:</strong> ${activeEnrollments.length} de 4-8 materias (${activeEnrollments.reduce((acc, e) => acc + (e.credits || 7), 0)} créditos) | 
                <span class="${activeEnrollments.length >= 4 ? 'text-success' : 'text-warning'}">
                    ${activeEnrollments.length >= 4 ? '✅ Mínimo cumplido' : '⚠️ Faltan ' + (4 - activeEnrollments.length) + ' para el mínimo'}
                </span>
                (RN-26)
            </div>
        </div>

        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3><i class="fa-solid fa-list"></i> Materias Disponibles</h3>
                <span class="${periodoActivo ? 'text-success' : 'text-danger'}" style="font-weight: bold;">
                    <i class="fa-solid ${periodoActivo ? 'fa-lock-open' : 'fa-lock'}"></i>
                    Periodo ${periodoActivo ? 'Abierto' : 'Cerrado'}
                </span>
            </div>
            
            ${!periodoActivo ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong style="color: #b91c1c;"><i class="fa-solid fa-exclamation-triangle"></i> Periodo de Inscripción Cerrado</strong>
                <p class="text-sm" style="margin-top: 0.5rem; color: #7f1d1d;">No puede inscribir nuevas materias en este momento. Espere a que el administrador abra el periodo de inscripción.</p>
            </div>
            ` : `
            <p class="text-muted text-sm" style="margin-bottom: 1rem;">Seleccione las materias en las que desea inscribirse.</p>
            `}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                ${subjects.map(s => {
        const isEnrolled = enrolledSubjectIds.includes(s.id);
        return `
                        <div class="card" style="margin: 0; background: var(--bg-secondary); ${isEnrolled || !periodoActivo ? 'opacity: 0.6;' : ''}">
                            <div class="flex justify-between items-start">
                                <h4 class="font-bold">${s.name}</h4>
                                <span class="text-lg font-bold" style="color: var(--primary-color);">${s.credits || 0}</span>
                            </div>
                            <p class="text-sm text-muted" style="margin: 0.5rem 0;">${s.description || 'Sin descripción'}</p>
                            ${isEnrolled ?
                `<button class="btn btn-sm btn-secondary w-full" disabled>
                                    <i class="fa-solid fa-check"></i> Ya Inscrito
                                </button>` :
                `<button class="btn btn-sm btn-primary w-full btn-enroll" data-id="${s.id}" data-name="${s.name}" data-credits="${s.credits || 0}" ${!periodoActivo ? 'disabled' : ''}>
                                    <i class="fa-solid fa-plus"></i> ${periodoActivo ? 'Inscribir' : 'No Disponible'}
                                </button>`
            }
                        </div>
                    `;
    }).join('')}
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                <strong>Reglas de inscripción (RN-26):</strong>
                <ul class="text-sm text-muted" style="margin: 0.5rem 0 0 1rem;">
                    <li><strong>Mínimo 4 materias</strong> por semestre (desde 2° semestre)</li>
                    <li><strong>Máximo 8 materias</strong> por semestre</li>
                    <li>Cada materia equivale a <strong>7 créditos</strong> (RN-24)</li>
                    <li>RF-10: Baja disponible hasta semana 4 del semestre</li>
                    <li><strong>El periodo de inscripción debe estar abierto</strong></li>
                </ul>
            </div>
        </div>

    `;

    mainContainer.innerHTML = html;

    // Event: Inscribirse a materia
    document.querySelectorAll('.btn-enroll').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.dataset.id;
            const subjectName = btn.dataset.name;
            const credits = parseInt(btn.dataset.credits) || 0;

            if (myEnrollments.length >= 8) {
                showToast('No puede inscribir más de 8 materias (RN-12)', 'error');
                return;
            }

            const result = await DB.enrollSubject({
                studentId: user.id,
                subjectId,
                subjectName,
                credits
            });

            if (result.success) {
                showToast(`Inscrito a ${subjectName}`, 'success');
                renderUnivEnrollment(user);
            } else {
                showToast('Error: ' + (result.error || 'No se pudo inscribir'), 'error');
            }
        });
    });

    // Event: Dar de baja materia (RF-10) con validación mínimo 4 (RN-26)
    document.querySelectorAll('.btn-drop').forEach(btn => {
        btn.addEventListener('click', async () => {
            const enrollmentId = btn.dataset.id;
            const subjectName = btn.dataset.name;

            // RN-26: No permitir bajar de 4 materias
            if (activeEnrollments.length <= 4) {
                showToast('No puede dar de baja más materias. Mínimo requerido: 4 (RN-26)', 'warning');
                return;
            }

            if (confirm(`¿Está seguro de dar de baja la materia "${subjectName}"?\n\nEsta acción no se puede deshacer.`)) {
                const reason = prompt('Motivo de la baja (opcional):') || '';

                const result = await DB.dropSubject(enrollmentId, reason);
                if (result.success) {
                    showToast(`Materia "${subjectName}" dada de baja`, 'success');
                    renderUnivEnrollment(user);
                } else {
                    showToast('Error: ' + (result.error || 'No se pudo dar de baja'), 'error');
                }
            }
        });
    });
}


// Funcionalidad Tutor: Manejo de Hijos (RN-6, RN-7, RF-12)
async function renderTutorChildren(tutorUser) {
    pageTitle.textContent = 'Mis Estudiantes';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando estudiantes vinculados...</div>';

    // Obtener todos los usuarios para buscar los estudiantes vinculados
    const allUsers = await DB.getUsers();

    // Obtener IDs de estudiantes vinculados al tutor
    const studentIds = tutorUser.students || [];

    // Filtrar para obtener solo los estudiantes vinculados
    const children = allUsers.filter(u => studentIds.includes(u.id) && u.role === 'alumno');

    if (children.length === 0) {
        mainContainer.innerHTML = `
            <div class="card">
                <div class="text-center text-muted p-4">
                    <i class="fa-solid fa-users-slash" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No hay estudiantes vinculados</h3>
                    <p>No tiene estudiantes registrados a su cuenta.</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    children.forEach((child, index) => {
        // Calcular edad del estudiante si tiene email con año
        let age = '-';
        if (child.email) {
            const matchYear = child.email.match(/(\d{4})@/);
            if (matchYear) {
                age = new Date().getFullYear() - parseInt(matchYear[1]);
            }
        }

        const level = child.level || 'Sin asignar';

        // RN-6: Tutor role restricted in Prep/Univ
        const isRestrictedLevel = ['Preparatoria', 'Universidad'].includes(level);
        // RN-7: Majority check
        const isAdult = age !== '-' && age >= 18;
        const canEdit = !isAdult;

        html += `
            <div class="card mb-4" style="margin-bottom: 1rem;" id="student-card-${index}">
                <h3>${child.name} <span class="text-muted text-sm">(${level})</span></h3>
                <p><strong>Boleta:</strong> ${child.username}</p>
                <p><strong>Email:</strong> ${child.email || '-'}</p>
                ${age !== '-' ? `<p><strong>Año nacimiento:</strong> ${new Date().getFullYear() - age}</p>` : ''}
        `;

        if (isRestrictedLevel) {
            html += `<div class="alert alert-warning" style="background: #FEF3C7; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                       <i class="fa-solid fa-triangle-exclamation"></i> 
                       <strong>Restricción (RN-6):</strong> En este nivel, usted es únicamente contacto de emergencia. No tiene acceso a calificaciones ni trámites.
                     </div>`;
        } else {
            html += `
                <div class="flex gap-2 mt-2" style="margin-top: 1rem;">
                   <button class="btn btn-primary btn-ver-boleta" data-student-id="${child.id}" data-student-name="${child.name}">
                       <i class="fa-solid fa-file-lines"></i> Ver Boleta
                   </button>
                   ${canEdit ? `<button class="btn btn-secondary btn-actualizar-datos" data-student-id="${child.id}" data-student-name="${child.name}" data-student-email="${child.email || ''}">
                       <i class="fa-solid fa-pen-to-square"></i> Actualizar Datos
                   </button>` : '<span class="text-muted text-sm">(Mayor de edad - Sin edición)</span>'}
                </div>
            `;
        }
        html += `</div>`;
    });

    mainContainer.innerHTML = html;

    // Agregar eventos a botones Ver Boleta
    document.querySelectorAll('.btn-ver-boleta').forEach(btn => {
        btn.addEventListener('click', async () => {
            const studentId = btn.getAttribute('data-student-id');
            const studentName = btn.getAttribute('data-student-name');

            // Obtener calificaciones del estudiante
            const grades = await DB.getGrades();
            const studentGrades = grades.filter(g => g.studentId === studentId);

            let gradesHtml = `
                <div class="card">
                    <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                        <h3><i class="fa-solid fa-file-lines"></i> Boleta de ${studentName}</h3>
                        <button class="btn btn-secondary btn-volver-lista"><i class="fa-solid fa-arrow-left"></i> Volver</button>
                    </div>
            `;

            if (studentGrades.length === 0) {
                gradesHtml += `<p class="text-muted text-center">No hay calificaciones registradas para este estudiante.</p>`;
            } else {
                gradesHtml += `
                    <table>
                        <thead>
                            <tr>
                                <th>Materia</th>
                                <th class="text-center">Parcial 1</th>
                                <th class="text-center">Parcial 2</th>
                                <th class="text-center">Parcial 3</th>
                                <th class="text-center">Promedio</th>
                                <th class="text-center">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                studentGrades.forEach(g => {
                    const avg = g.average || '-';
                    const status = parseFloat(avg) >= 6 ? 'APROBADO' : (avg !== '-' ? 'REPROBADO' : '-');
                    const statusClass = parseFloat(avg) >= 6 ? 'text-success' : 'text-error';
                    gradesHtml += `
                        <tr>
                            <td class="font-bold">${g.subject}</td>
                            <td class="text-center">${g.p1 || '-'}</td>
                            <td class="text-center">${g.p2 || '-'}</td>
                            <td class="text-center">${g.p3 || '-'}</td>
                            <td class="text-center font-bold">${avg}</td>
                            <td class="text-center"><span class="${statusClass} font-bold text-sm">${status}</span></td>
                        </tr>
                    `;
                });
                gradesHtml += `</tbody></table>`;
            }
            gradesHtml += `</div>`;

            mainContainer.innerHTML = gradesHtml;

            // Botón volver
            document.querySelector('.btn-volver-lista').addEventListener('click', () => {
                renderTutorChildren(tutorUser);
            });
        });
    });

    // Agregar eventos a botones Actualizar Datos
    document.querySelectorAll('.btn-actualizar-datos').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = btn.getAttribute('data-student-id');
            const studentName = btn.getAttribute('data-student-name');
            const studentEmail = btn.getAttribute('data-student-email');

            mainContainer.innerHTML = `
                <div class="card" style="max-width: 500px; margin: 0 auto;">
                    <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                        <h3><i class="fa-solid fa-pen-to-square"></i> Actualizar Datos</h3>
                        <button class="btn btn-secondary btn-volver-lista"><i class="fa-solid fa-arrow-left"></i> Volver</button>
                    </div>
                    <p class="text-muted" style="margin-bottom: 1rem;">Estudiante: <strong>${studentName}</strong></p>
                    
                    <form id="form-actualizar-datos">
                        <label class="input-label">Teléfono de Emergencia</label>
                        <input type="tel" id="telefono-emergencia" class="input-field" placeholder="55 1234 5678">
                        
                        <label class="input-label">Dirección</label>
                        <input type="text" id="direccion" class="input-field" placeholder="Calle, Número, Colonia">
                        
                        <label class="input-label">Alergias o Condiciones Médicas</label>
                        <textarea id="notas-medicas" class="input-field" rows="3" placeholder="Ninguna"></textarea>
                        
                        <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">
                            <i class="fa-solid fa-save"></i> Guardar Cambios
                        </button>
                    </form>
                </div>
            `;

            // Botón volver
            document.querySelector('.btn-volver-lista').addEventListener('click', () => {
                renderTutorChildren(tutorUser);
            });

            // Submit form
            document.getElementById('form-actualizar-datos').addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('Datos actualizados correctamente', 'success');
                renderTutorChildren(tutorUser);
            });
        });
    });
}

// Funcionalidad Estudiante: Ver Horario (RF-11, RN-11, RN-12)
// Genera horario dinámicamente basado en materias inscritas
async function renderStudentSchedule() {
    pageTitle.textContent = 'Mi Horario';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando horario...</div>';

    const user = Auth.currentUser;
    const nivelEstudiante = user?.level || 'Universidad';

    // Obtener materias inscritas del estudiante
    const myEnrollments = await DB.getEnrollments(user.id);
    const activeEnrollments = myEnrollments.filter(e => e.status === 'Inscrito');

    // Configuración de horarios según nivel
    const scheduleConfig = {
        'Kinder': { startHour: 8, duration: 2, maxPerDay: 2 },
        'Primaria': { startHour: 7, duration: 1.5, maxPerDay: 3 },
        'Secundaria': { startHour: 7, duration: 1.5, maxPerDay: 4 },
        'Universidad': { startHour: 7, duration: 1.5, maxPerDay: 4 }
    };

    const config = scheduleConfig[nivelEstudiante] || scheduleConfig['Universidad'];
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    // Generar horario automático balanceado en todos los días
    // Objetivo: Distribuir materias uniformemente en los 5 días
    const generatedClasses = [];

    // Crear estructura para tracking de slots por día
    const daySlots = {};
    days.forEach(day => {
        daySlots[day] = [];
    });

    // Calcular cuántas sesiones por materia según nivel
    // Universidad/Secundaria: 2 sesiones/semana - Kinder/Primaria: 3 sesiones
    const sessionsPerSubject = ['Kinder', 'Primaria'].includes(nivelEstudiante) ? 3 : 2;

    // Total de sesiones a distribuir
    const totalSessions = activeEnrollments.length * sessionsPerSubject;

    // Distribuir sesiones balanceadamente
    // Primero, calcular cuántas sesiones por día idealmente
    const sessionsPerDay = Math.ceil(totalSessions / 5);

    // Asignar cada materia a días alternados para balance
    activeEnrollments.forEach((enrollment, enrollIndex) => {
        // Para cada sesión de la materia
        for (let session = 0; session < sessionsPerSubject; session++) {
            // Calcular día basado en distribución uniforme
            // Usar offset diferente para cada sesión de la misma materia
            const dayOffset = Math.floor((enrollIndex * sessionsPerSubject + session) % 5);
            const day = days[dayOffset];

            // Encontrar el siguiente slot disponible en ese día
            const slotIndex = daySlots[day].length;
            const hour = config.startHour + (slotIndex * config.duration);

            // Calcular tiempo con manejo de horas y minutos
            const hours = Math.floor(hour);
            const minutes = Math.round((hour - hours) * 60);
            const endHour = hour + config.duration;
            const endHours = Math.floor(endHour);
            const endMinutes = Math.round((endHour - endHours) * 60);

            const timeStart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            const timeEnd = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

            generatedClasses.push({
                day: day,
                time: timeStart,
                timeEnd: timeEnd,
                subject: enrollment.subjectName,
                room: `Salón Aula ${100 + enrollIndex + 1}`,
                credits: enrollment.credits || 7
            });

            // Registrar slot usado
            daySlots[day].push(enrollment.subjectName);
        }
    });

    // Agregar descansos después de cada 2 clases consecutivas
    const addBreaks = () => {
        const classesWithBreaks = [];
        days.forEach(day => {
            const dayClasses = generatedClasses
                .filter(c => c.day === day)
                .sort((a, b) => a.time.localeCompare(b.time));

            dayClasses.forEach((cls, idx) => {
                classesWithBreaks.push(cls);
                // Agregar descanso después de cada 2 clases
                if ((idx + 1) % 2 === 0 && idx < dayClasses.length - 1) {
                    const breakTime = cls.timeEnd;
                    const breakHour = parseInt(breakTime.split(':')[0]);
                    const breakMin = parseInt(breakTime.split(':')[1]);
                    const breakEndMin = breakMin + 30;
                    const breakEndHour = breakHour + Math.floor(breakEndMin / 60);
                    const breakEndMinFinal = breakEndMin % 60;

                    classesWithBreaks.push({
                        day: day,
                        time: breakTime,
                        timeEnd: `${String(breakEndHour).padStart(2, '0')}:${String(breakEndMinFinal).padStart(2, '0')}`,
                        subject: '🍎 Descanso (30 min)',
                        room: '',
                        isBreak: true
                    });
                }
            });
        });
        return classesWithBreaks;
    };

    const classesWithBreaks = addBreaks();

    // Helper to create class block
    const cls = (name, room) => `
        <div style="background: var(--bg-color); padding: 0.75rem; border-radius: 8px; border-left: 3px solid var(--accent-color);">
            <div class="font-bold text-sm">${name}</div>
            <div class="text-xs text-muted">${room}</div>
        </div>
    `;

    // Obtener time slots únicos y ordenarlos (usando classesWithBreaks)
    const timeSlots = [...new Set(classesWithBreaks.map(c => c.time))].sort();

    // Crear mapa de clases por día+hora
    const classMap = {};
    classesWithBreaks.forEach(c => {
        const key = `${c.day}-${c.time}`;
        if (!classMap[key]) {
            classMap[key] = c;
        }
    });

    // Generar filas del horario
    let scheduleRows = '';

    if (activeEnrollments.length === 0) {
        scheduleRows = `
            <div style="grid-column: span 6; text-align: center; padding: 3rem;">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h4 class="text-muted">No tienes materias inscritas</h4>
                <p class="text-sm text-muted">Tu horario se generará automáticamente cuando te inscriban en materias.</p>
            </div>
        `;
    } else {
        timeSlots.forEach((time) => {
            // Buscar una clase en este slot para obtener timeEnd
            const sampleClass = classesWithBreaks.find(c => c.time === time);
            const endTime = sampleClass?.timeEnd || time;
            const isBreakRow = sampleClass?.isBreak;

            scheduleRows += `<div class="text-muted text-sm font-bold flex items-center justify-center">${time} - ${endTime}</div>`;

            days.forEach(day => {
                const key = `${day}-${time}`;
                const classInfo = classMap[key];
                if (classInfo) {
                    if (classInfo.isBreak) {
                        // Estilo especial para descansos
                        scheduleRows += `<div style="background: #fef3c7; color: #92400e; padding: 0.75rem; border-radius: 8px; text-align: center; font-weight: 600; border-left: 3px solid #f59e0b;">
                            ${classInfo.subject}
                        </div>`;
                    } else {
                        scheduleRows += cls(classInfo.subject, classInfo.room);
                    }
                } else {
                    scheduleRows += `<div style="background: var(--bg-soft); padding: 0.75rem; border-radius: 8px; opacity: 0.3; text-align: center;">
                        <span class="text-muted text-xs">-</span>
                    </div>`;
                }
            });
        });
    }

    // Obtener color del nivel
    const levelTheme = THEMES[nivelEstudiante] || THEMES['Universidad'];
    const levelColor = levelTheme.primary;

    mainContainer.innerHTML = `
        <div class="card" style="border-top: 4px solid ${levelColor};">
            <div class="flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h3 style="margin-bottom: 0.5rem;">Mi Horario - Semestre 2025-1</h3>
                    <span style="background: ${levelColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                        <i class="fa-solid fa-graduation-cap"></i> ${nivelEstudiante}
                    </span>
                </div>
                <div class="text-right">
                    <div class="text-sm text-muted">${activeEnrollments.length} materia(s)</div>
                    <div class="font-bold" style="color: ${levelColor};">${activeEnrollments.reduce((acc, e) => acc + (e.credits || 0), 0)} créditos</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 0.75rem; overflow-x: auto;">
                <!-- Header -->
                <div></div>
                <div class="text-center font-bold text-muted text-sm">Lunes</div>
                <div class="text-center font-bold text-muted text-sm">Martes</div>
                <div class="text-center font-bold text-muted text-sm">Miércoles</div>
                <div class="text-center font-bold text-muted text-sm">Jueves</div>
                <div class="text-center font-bold text-muted text-sm">Viernes</div>

                ${scheduleRows}
            </div>
            
            ${activeEnrollments.length > 0 ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                <strong><i class="fa-solid fa-info-circle"></i> Materias inscritas:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${activeEnrollments.map(e => `
                        <span style="background: ${levelColor}22; color: ${levelColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">
                            ${e.subjectName} (${e.credits || 0} cr)
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// ... (Rest of existing functions like renderGrades, renderReports, etc. remain used) ...

// Funcionalidad Admin: Generar Reportes (CU-003, RF-17)
function renderReports() {
    pageTitle.textContent = 'Generación de Reportes (RF-17)';

    mainContainer.innerHTML = `
        <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3><i class="fa-solid fa-file-pdf" style="color: #DC2626;"></i> Generar Reporte Oficial</h3>
            <p class="text-muted" style="margin-bottom: 1.5rem;">Configure los parámetros para exportar la información en formato PDF.</p>
            
            <form id="report-form">
                <div class="input-group">
                    <label class="input-label">Tipo de Reporte</label>
                    <select id="report-type" class="input-field" required>
                        <option value="boleta">📊 Boleta de Calificaciones</option>
                        <option value="asistencia">📋 Reporte de Asistencia</option>
                        <option value="horario">📅 Horario de Clases</option>
                        <option value="incidencias">⚠️ Reporte de Incidencias</option>
                    </select>
                </div>

                <div class="input-group">
                    <label class="input-label">Nivel Educativo</label>
                    <select id="report-level" class="input-field">
                        <option value="todos">Todos los niveles</option>
                        <option value="Kinder">Kinder</option>
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                        <option value="Universidad">Universidad</option>
                    </select>
                </div>

                <div class="input-group">
                    <label class="input-label">Periodo / Ciclo</label>
                    <select id="report-period" class="input-field">
                        <option>2025-2026 A</option>
                        <option>2025-2026 B</option>
                        <option>2024-2025 A</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary w-full" style="gap: 0.5rem;">
                    <i class="fa-solid fa-download"></i> Descargar Reporte PDF
                </button>
            </form>
        </div>
        
        <div class="card" style="max-width: 700px; margin: 1.5rem auto 0;">
            <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-clock-rotate-left"></i> Reportes Recientes</h4>
            <p class="text-muted text-sm">Los reportes generados se descargarán automáticamente.</p>
        </div>
    `;

    document.getElementById('report-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando PDF...';
        btn.disabled = true;

        const reportType = document.getElementById('report-type').value;
        const reportLevel = document.getElementById('report-level').value;
        const reportPeriod = document.getElementById('report-period').value;

        try {
            await generatePDFReport(reportType, reportLevel, reportPeriod);
            showToast('Reporte PDF generado y descargado exitosamente', 'success');
        } catch (error) {
            showToast('Error al generar reporte: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// RF-17: Generador de Reportes PDF usando jsPDF
async function generatePDFReport(type, level, period) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Convertir "todos" a null para incluir todos los niveles
    const filterLevel = (level === 'todos' || !level) ? null : level;

    // Encabezado común
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // color-primario
    doc.text('SchoolHub', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // texto-secundario
    doc.text('Sistema de Gestión Escolar', 105, 27, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(56, 189, 248); // color-acento
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    // Fecha de generación
    const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Generado: ${fecha}`, 190, 38, { align: 'right' });
    doc.text(`Periodo: ${period}`, 20, 38);
    if (filterLevel) doc.text(`Nivel: ${filterLevel}`, 20, 43);

    switch (type) {
        case 'boleta':
            await generateGradesPDF(doc, filterLevel);
            break;
        case 'asistencia':
            await generateAttendancePDF(doc, filterLevel);
            break;
        case 'horario':
            await generateSchedulePDF(doc, filterLevel);
            break;
        case 'incidencias':
            await generateIncidentsPDF(doc, filterLevel);
            break;
    }

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Documento oficial - SchoolHub © 2026', 105, 295, { align: 'center' });
    }

    // Descargar
    const filename = `SchoolHub_${type}_${filterLevel || 'todos'}_${Date.now()}.pdf`;
    doc.save(filename);
}

// RF-17: Generar PDF de Calificaciones
async function generateGradesPDF(doc, level) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Reporte de Calificaciones', 105, 52, { align: 'center' });

    // Obtener datos
    const gradesData = await DB.getGrades();
    const usersData = await DB.getUsers();

    const students = usersData.filter(u => u.role === 'alumno' && (!level || u.level === level));

    const tableData = [];
    students.forEach(student => {
        const studentGrades = gradesData.filter(g => g.studentId === student.id);
        if (studentGrades.length > 0) {
            studentGrades.forEach(grade => {
                tableData.push([
                    student.name,
                    student.level || 'N/A',
                    grade.subject,
                    grade.p1 || '-',
                    grade.p2 || '-',
                    grade.p3 || '-',
                    grade.average || '-'
                ]);
            });
        } else {
            tableData.push([student.name, student.level || 'N/A', 'Sin materias', '-', '-', '-', '-']);
        }
    });

    if (tableData.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay datos de calificaciones disponibles.', 105, 70, { align: 'center' });
        return;
    }

    doc.autoTable({
        startY: 58,
        head: [['Alumno', 'Nivel', 'Materia', 'P1', 'P2', 'P3', 'Promedio']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 3 }
    });
}

// RF-17: Generar PDF de Asistencia
async function generateAttendancePDF(doc, level) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Reporte de Asistencia', 105, 52, { align: 'center' });

    const attendanceData = await DB.getAttendance();

    if (!attendanceData || attendanceData.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay registros de asistencia disponibles.', 105, 70, { align: 'center' });
        return;
    }

    const tableData = attendanceData.map(a => [
        a.date,
        a.studentName,
        a.groupId,
        a.status,
        a.notes || '-'
    ]);

    doc.autoTable({
        startY: 58,
        head: [['Fecha', 'Alumno', 'Grupo', 'Estado', 'Notas']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            3: {
                cellWidth: 25,
                fontStyle: 'bold'
            }
        },
        didParseCell: function (data) {
            if (data.column.index === 3 && data.cell.section === 'body') {
                if (data.cell.raw === 'Presente') {
                    data.cell.styles.textColor = [16, 185, 129]; // verde
                } else if (data.cell.raw === 'Ausente') {
                    data.cell.styles.textColor = [239, 68, 68]; // rojo
                } else if (data.cell.raw === 'Retardo') {
                    data.cell.styles.textColor = [245, 158, 11]; // amarillo
                }
            }
        }
    });
}

// RF-17: Generar PDF de Horario
async function generateSchedulePDF(doc, level) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Horario de Clases${level ? ' - ' + level : ''}`, 105, 52, { align: 'center' });

    const schedulesData = await DB.getSchedules();
    const targetSchedules = level
        ? schedulesData.filter(s => s.level === level)
        : schedulesData;

    if (!targetSchedules || targetSchedules.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay horarios disponibles.', 105, 70, { align: 'center' });
        return;
    }

    let yPos = 58;

    for (const schedule of targetSchedules) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(56, 189, 248);
        doc.text(`Nivel: ${schedule.level}`, 20, yPos);
        yPos += 5;

        const tableData = schedule.classes.map(c => [
            c.day,
            c.time,
            c.subject,
            c.room
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Día', 'Hora', 'Materia', 'Aula']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 20, right: 20 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }
}

// RF-17: Generar PDF de Incidencias
async function generateIncidentsPDF(doc, level) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Reporte de Incidencias${level ? ' - ' + level : ''}`, 105, 52, { align: 'center' });

    // Obtener incidencias y usuarios
    const [incidentsData, usersData] = await Promise.all([
        DB.getIncidents(),
        DB.getUsers()
    ]);

    // Crear mapa de usuarios para búsqueda rápida
    const usersMap = {};
    usersData.forEach(u => { usersMap[u.id] = u; });

    // Filtrar por nivel si es necesario
    let filteredIncidents = incidentsData;
    if (level) {
        filteredIncidents = incidentsData.filter(inc => {
            const student = usersMap[inc.studentId];
            return student && student.level === level;
        });
    }

    if (!filteredIncidents || filteredIncidents.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay incidencias registradas.', 105, 70, { align: 'center' });
        return;
    }

    // Estadísticas resumidas
    const stats = {
        total: filteredIncidents.length,
        conducta: filteredIncidents.filter(i => i.type === 'conducta').length,
        retardo: filteredIncidents.filter(i => i.type === 'retardo').length,
        falta: filteredIncidents.filter(i => i.type === 'falta').length,
        pendientes: filteredIncidents.filter(i => i.status === 'pendiente').length,
        revisadas: filteredIncidents.filter(i => i.status === 'revisada').length,
        sancionadas: filteredIncidents.filter(i => i.status === 'sancionada').length
    };

    // Mostrar resumen
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total: ${stats.total} | Conducta: ${stats.conducta} | Retardos: ${stats.retardo} | Faltas: ${stats.falta}`, 20, 60);
    doc.text(`Pendientes: ${stats.pendientes} | Revisadas: ${stats.revisadas} | Sancionadas: ${stats.sancionadas}`, 20, 65);

    // Tabla de incidencias
    const tableData = filteredIncidents.map(inc => {
        const student = usersMap[inc.studentId];
        const teacher = usersMap[inc.teacherId];

        // Traducir tipo
        const tipoMap = { 'conducta': 'Conducta', 'retardo': 'Retardo', 'falta': 'Falta' };
        const statusMap = { 'pendiente': 'Pendiente', 'revisada': 'Revisada', 'sancionada': 'Sancionada' };

        return [
            inc.date || 'N/A',
            student?.name || inc.studentName || 'N/A',
            student?.level || 'N/A',
            tipoMap[inc.type] || inc.type || 'N/A',
            inc.description?.substring(0, 40) + (inc.description?.length > 40 ? '...' : '') || 'N/A',
            statusMap[inc.status] || inc.status || 'Pendiente',
            teacher?.name || inc.teacherName || 'N/A'
        ];
    });

    doc.autoTable({
        startY: 72,
        head: [['Fecha', 'Alumno', 'Nivel', 'Tipo', 'Descripción', 'Estado', 'Docente']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 8 }, // Rojo para incidencias
        alternateRowStyles: { fillColor: [254, 242, 242] }, // Rosado claro
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 30 },
            2: { cellWidth: 18 },
            3: { cellWidth: 18 },
            4: { cellWidth: 45 },
            5: { cellWidth: 20 },
            6: { cellWidth: 30 }
        },
        didParseCell: function (data) {
            // Colorear estado
            if (data.section === 'body' && data.column.index === 5) {
                if (data.cell.raw === 'Sancionada') {
                    data.cell.styles.textColor = [220, 38, 38]; // rojo
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.raw === 'Revisada') {
                    data.cell.styles.textColor = [34, 197, 94]; // verde
                } else if (data.cell.raw === 'Pendiente') {
                    data.cell.styles.textColor = [245, 158, 11]; // amarillo
                }
            }
            // Colorear tipo
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'Conducta') {
                    data.cell.styles.textColor = [220, 38, 38];
                } else if (data.cell.raw === 'Retardo') {
                    data.cell.styles.textColor = [245, 158, 11];
                } else if (data.cell.raw === 'Falta') {
                    data.cell.styles.textColor = [59, 130, 246];
                }
            }
        }
    });
}


// ... (Retain renderAbsences, renderGrades, renderStudentGrades, renderHomeDashboard, Calendar Logic) ...

// Funcionalidad Admin: Justificar Inasistencias (CU-004)
async function renderAbsences() {
    pageTitle.textContent = 'Solicitudes de Justificantes';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando datos...</div>';

    // Obtener solicitudes de justificantes
    const justificationRequests = await DB.getJustificationRequests();

    // Filtrar solicitudes pendientes
    const pendingRequests = justificationRequests.filter(r => r.status === 'Pendiente');
    const processedRequests = justificationRequests.filter(r => r.status !== 'Pendiente');

    // Sección de Solicitudes Pendientes de Estudiantes
    let requestsHtml = '';
    if (pendingRequests.length > 0) {
        requestsHtml = `
            <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--warning-color);">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3><i class="fa-solid fa-file-circle-question"></i> Solicitudes Pendientes de Estudiantes</h3>
                    <span class="badge" style="background: var(--warning-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">
                        ${pendingRequests.length} pendiente${pendingRequests.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>Nivel</th>
                                <th>Fecha Falta</th>
                                <th>Materia</th>
                                <th>Motivo</th>
                                <th>Fecha Solicitud</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingRequests.map(r => `
                                <tr>
                                    <td class="font-bold">${r.studentName}</td>
                                    <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${r.level || '-'}</span></td>
                                    <td>${r.date}</td>
                                    <td>${r.subject || '-'}</td>
                                    <td class="text-sm" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${r.reason}</td>
                                    <td class="text-muted text-sm">${r.createdAt ? r.createdAt.split(' ')[0] : '-'}</td>
                                    <td>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <button class="btn btn-sm btn-success btn-approve-request" data-id="${r.id}" data-student="${r.studentName}" title="Aprobar">
                                                <i class="fa-solid fa-check"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger btn-reject-request" data-id="${r.id}" data-student="${r.studentName}" title="Rechazar">
                                                <i class="fa-solid fa-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        // Mensaje cuando no hay solicitudes pendientes
        requestsHtml = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <i class="fa-solid fa-check-circle" style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;"></i>
                <h3>No hay solicitudes pendientes</h3>
                <p class="text-muted">Todas las solicitudes de justificantes han sido procesadas.</p>
            </div>
        `;
    }

    // Sección de Historial de Solicitudes Procesadas
    let historyHtml = '';
    if (processedRequests.length > 0) {
        historyHtml = `
            <div class="card" style="margin-top: 1.5rem;">
                <h3><i class="fa-solid fa-clock-rotate-left"></i> Historial de Solicitudes Procesadas</h3>
                <div style="overflow-x: auto; margin-top: 1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>Fecha Falta</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Respuesta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${processedRequests.map(r => {
            const statusClass = r.status === 'Aprobada' ? 'text-success' : 'text-error';
            return `
                                    <tr>
                                        <td class="font-bold">${r.studentName}</td>
                                        <td>${r.date}</td>
                                        <td class="text-sm">${r.reason}</td>
                                        <td><span class="${statusClass} font-bold">${r.status}</span></td>
                                        <td class="text-sm text-muted">${r.adminResponse || '-'}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    mainContainer.innerHTML = requestsHtml + historyHtml;

    // Event Listeners para botones de Aprobar Solicitud
    document.querySelectorAll('.btn-approve-request').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const studentName = btn.getAttribute('data-student');
            const response = prompt(`Aprobar solicitud de ${studentName}.\nIngrese un comentario (opcional):`) || 'Solicitud aprobada';

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const result = await DB.approveJustificationRequest(id, response);
            if (result.success) {
                showToast(`Solicitud de ${studentName} aprobada`, 'success');
                renderAbsences();
            } else {
                showToast('Error al aprobar: ' + (result.error || 'Error desconocido'), 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            }
        });
    });

    // Event Listeners para botones de Rechazar Solicitud
    document.querySelectorAll('.btn-reject-request').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const studentName = btn.getAttribute('data-student');
            const response = prompt(`Rechazar solicitud de ${studentName}.\nIngrese el motivo del rechazo:`);

            if (!response || response.trim() === '') {
                showToast('Debe ingresar un motivo para rechazar la solicitud', 'warning');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const result = await DB.rejectJustificationRequest(id, response);
            if (result.success) {
                showToast(`Solicitud de ${studentName} rechazada`, 'warning');
                renderAbsences();
            } else {
                showToast('Error al rechazar: ' + (result.error || 'Error desconocido'), 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-times"></i>';
            }
        });
    });
}

// Funcionalidad Docente: Capturar Calificaciones (RF-6)

async function renderGrades() {
    pageTitle.textContent = 'Captura de Calificaciones (RF-6)';

    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando alumnos y calificaciones...</div>';

    const user = Auth.currentUser;

    const [users, grades, allGroups] = await Promise.all([
        DB.getUsers(),
        DB.getGrades(),
        DB.getGroups()
    ]);

    // Obtener grupos del docente (por teacherId o por nivel)
    let misGrupos = allGroups.filter(g => g.teacherId === user.id);
    if (misGrupos.length === 0 && user.level) {
        misGrupos = allGroups.filter(g => g.level === user.level);
    }

    // Filtrar alumnos según el nivel del docente (RN-8)
    const nivelDocente = user.level || '';
    let students = users.filter(u => u.role === ROLES.ALUMNO);

    // Si el docente tiene nivel asignado, solo mostrar alumnos de ese nivel
    if (nivelDocente) {
        students = students.filter(s => s.level === nivelDocente);
    }

    // Usar la especialidad del docente como materia, o un valor por defecto
    const subject = user.specialty || "General";

    // Nombre del grupo del docente
    const nombreGrupo = misGrupos.length > 0
        ? `${misGrupos[0].name} - ${nivelDocente}`
        : `${nivelDocente || 'Sin asignar'}`;

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3>Grupo: ${nombreGrupo} - ${subject}</h3>
                <button class="btn btn-secondary text-sm">Cambiar Grupo</button>
            </div>
            
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Boleta</th>
                            <th>Alumno</th>
                            <th style="width: 100px;">1er Parcial</th>
                            <th style="width: 100px;">2do Parcial</th>
                            <th style="width: 100px;">3er Parcial</th>
                            <th>Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (students.length === 0) {
        html += `<tr><td colspan="6" class="text-center text-muted">No hay alumnos de nivel ${nivelDocente || 'asignado'}</td></tr>`;
    }

    students.forEach((s) => {
        // Find existing grade for this student and subject
        const userGrade = grades.find(g => g.studentId === s.id && g.subject === subject);

        const p1 = userGrade ? userGrade.p1 : "";
        const p2 = userGrade ? userGrade.p2 : "";
        const p3 = userGrade ? userGrade.p3 : "";

        // Calculate average if data exists
        let avg = "";
        if (userGrade && userGrade.average) {
            avg = userGrade.average;
        } else if (p1 || p2 || p3) {
            let sum = (parseFloat(p1) || 0) + (parseFloat(p2) || 0) + (parseFloat(p3) || 0);
            avg = (sum / 3).toFixed(1);
        }

        html += `
            <tr class="grade-row" data-student-id="${s.id}">
                <td class="text-muted">${s.username}</td>
                <td class="font-bold">${s.name}</td>
                <td><input type="number" class="input-field grade-input p1" value="${p1}" min="0" max="10" step="0.1" style="padding: 0.5rem;"></td>
                <td><input type="number" class="input-field grade-input p2" value="${p2}" min="0" max="10" step="0.1" style="padding: 0.5rem;"></td>
                <td><input type="number" class="input-field grade-input p3" value="${p3}" placeholder="-" min="0" max="10" step="0.1" style="padding: 0.5rem;"></td>
                <td class="font-bold text-center grade-avg">${avg}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>

            <div class="flex justify-end" style="margin-top: 2rem;">
                <button id="save-grades-btn" class="btn btn-primary">
                    <i class="fa-solid fa-save"></i> Guardar Calificaciones
                </button>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Dynamic Average Calculation
    const gradeInputs = document.querySelectorAll('.grade-input');

    // Helper to update colors
    const updateColor = (cell, val) => {
        cell.classList.remove('text-success', 'text-error');
        if (val && val < 6) cell.classList.add('text-error');
        else if (val >= 6) cell.classList.add('text-success');
    };

    // Initialize colors
    document.querySelectorAll('.grade-avg').forEach(cell => updateColor(cell, parseFloat(cell.textContent)));
    gradeInputs.forEach(input => {
        // Validar que el valor esté entre 0 y 10 inmediatamente
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (val < 0) {
                e.target.value = 0;
            } else if (val > 10) {
                e.target.value = 10;
            }

            // Recalcular promedio
            const row = e.target.closest('tr');
            const inputs = row.querySelectorAll('.grade-input');
            let sum = 0;
            let count = 0;

            inputs.forEach(inp => {
                let v = parseFloat(inp.value);
                if (!isNaN(v) && v >= 0) {
                    if (v > 10) v = 10;
                    sum += v;
                    count++;
                }
            });

            let newAvg = 0;
            if (count > 0) {
                newAvg = Math.max(0, Math.min(10, (sum / 3))).toFixed(1);
            }

            const avgCell = row.querySelector('.grade-avg');
            avgCell.textContent = newAvg;
            updateColor(avgCell, parseFloat(newAvg));
        });
    });

    document.getElementById('save-grades-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-grades-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';
        btn.disabled = true;

        const gradesToSave = [];
        document.querySelectorAll('.grade-row').forEach(row => {
            const studentId = row.getAttribute('data-student-id');
            const p1 = row.querySelector('.p1').value;
            const p2 = row.querySelector('.p2').value;
            const p3 = row.querySelector('.p3').value;
            const avg = row.querySelector('.grade-avg').textContent;

            gradesToSave.push({
                studentId: studentId,
                subject: subject,
                p1: p1,
                p2: p2,
                p3: p3,
                average: avg
            });
        });

        const result = await DB.saveGrades(gradesToSave);

        if (result.success) {
            showToast('Calificaciones guardadas correctamente', 'success');
        } else {
            showToast('Error al guardar: ' + result.error, 'error');
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// Funcionalidad Estudiante: Ver Calificaciones (RF-11)
// Student Feature: View Grades (RF-11)
async function renderStudentGrades() {
    pageTitle.textContent = 'Mis Calificaciones (RF-11)';

    // Show loading state
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando mis calificaciones...</div>';

    const user = Auth.currentUser;

    // Obtener inscripciones del alumno y calificaciones
    const [myEnrollments, allGrades] = await Promise.all([
        DB.getEnrollments(user.id),
        DB.getGrades()
    ]);

    // Filtrar solo materias inscritas activas
    const activeEnrollments = myEnrollments.filter(e => e.status === 'Inscrito');

    // Filtrar calificaciones del estudiante
    const myGrades = allGrades.filter(g => g.studentId === user.id);

    // Crear mapa de calificaciones por nombre de materia
    const gradesMap = {};
    myGrades.forEach(g => {
        gradesMap[g.subject] = g;
    });

    // Calculate General Average based on enrolled subjects with grades
    let totalSum = 0;
    let totalSubjects = 0;

    activeEnrollments.forEach(e => {
        const grade = gradesMap[e.subjectName];
        if (grade && grade.average) {
            totalSum += parseFloat(grade.average);
            totalSubjects++;
        }
    });

    const generalAvg = totalSubjects > 0 ? (totalSum / totalSubjects).toFixed(1) : "0.0";

    const levelColors = {
        'Kinder': '#ec4899',
        'Primaria': '#22c55e',
        'Secundaria': '#f59e0b',
        'Universidad': '#3b82f6'
    };
    const levelColor = levelColors[user.level] || '#3b82f6';

    let html = `
        <div class="card" style="border-top: 4px solid ${levelColor};">
             <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <div>
                    <h3>Boleta de Calificaciones</h3>
                    <span class="text-sm text-muted">${user.level || 'Sin nivel'}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm text-muted">Promedio General</div>
                    <div class="font-bold" style="font-size: 1.5rem; color: ${levelColor};">${generalAvg}</div>
                </div>
            </div>

            <table style="margin-top: 1rem;">
                <thead>
                    <tr>
                        <th style="width: 35%;">Materia</th>
                        <th class="text-center">Créditos</th>
                        <th class="text-center">Parcial 1</th>
                        <th class="text-center">Parcial 2</th>
                        <th class="text-center">Parcial 3</th>
                        <th class="text-center">Final</th>
                        <th class="text-center">Estatus</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (activeEnrollments.length === 0) {
        html += `<tr><td colspan="7" class="text-center text-muted">No tienes materias inscritas. Contacta a tu administrador.</td></tr>`;
    } else {
        activeEnrollments.forEach(e => {
            const grade = gradesMap[e.subjectName];
            const p1 = grade?.p1 || '-';
            const p2 = grade?.p2 || '-';
            const p3 = grade?.p3 || '-';
            const avg = grade?.average || '-';

            let status = 'PENDIENTE';
            let statusClass = 'text-muted';

            if (grade && grade.average) {
                const avgNum = parseFloat(grade.average);
                if (avgNum >= 6) {
                    status = 'APROBADO';
                    statusClass = 'text-success';
                } else {
                    status = 'REPROBADO';
                    statusClass = 'text-error';
                }
            }

            html += `
                     <tr>
                        <td>
                            <div class="font-bold">${e.subjectName}</div>
                            <div class="text-xs text-muted">Inscrito: ${e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('es-MX') : '-'}</div>
                        </td>
                        <td class="text-center">${e.credits || 0}</td>
                        <td class="text-center">${p1}</td>
                        <td class="text-center">${p2}</td>
                        <td class="text-center">${p3}</td>
                        <td class="text-center font-bold">${avg}</td>
                        <td class="text-center"><span class="${statusClass} text-xs font-bold">${status}</span></td>
                    </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                <strong>Resumen:</strong> ${activeEnrollments.length} materia(s) inscrita(s) | 
                ${totalSubjects} con calificación | 
                Total créditos: ${activeEnrollments.reduce((acc, e) => acc + (e.credits || 0), 0)}
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;
}

// Funcionalidad Estudiante: Solicitar Justificante
async function renderRequestJustification(user) {
    pageTitle.textContent = 'Solicitar Justificante';

    // Obtener solicitudes previas del estudiante
    const allRequests = await DB.getJustificationRequests();
    const myRequests = allRequests.filter(r => r.studentId === user.id);

    let historyHtml = '';
    if (myRequests.length > 0) {
        historyHtml = `
            <div class="card" style="margin-top: 1.5rem;">
                <h3><i class="fa-solid fa-clock-rotate-left"></i> Mis Solicitudes Anteriores</h3>
                <div style="overflow-x: auto; margin-top: 1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha de Falta</th>
                                <th>Materia</th>
                                <th>Motivo</th>
                                <th>Status</th>
                                <th>Respuesta Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${myRequests.map(r => {
            const statusClass = r.status === 'Aprobada' ? 'text-success' :
                r.status === 'Rechazada' ? 'text-error' : 'text-warning';
            return `
                                    <tr>
                                        <td>${r.date}</td>
                                        <td>${r.subject || '-'}</td>
                                        <td class="text-sm">${r.reason}</td>
                                        <td><span class="${statusClass} font-bold">${r.status}</span></td>
                                        <td class="text-sm text-muted">${r.adminResponse || '-'}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    mainContainer.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h3><i class="fa-solid fa-file-medical"></i> Nueva Solicitud de Justificante</h3>
            <p class="text-muted" style="margin-bottom: 1.5rem;">Complete el formulario para solicitar la justificación de una falta. El administrador revisará su solicitud.</p>
            
            <form id="justification-request-form">
                <div class="input-group">
                    <label class="input-label">Fecha de la Falta *</label>
                    <input type="date" id="absence-date" class="input-field" required max="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="input-group">
                    <label class="input-label">Materia (Opcional)</label>
                    <input type="text" id="absence-subject" class="input-field" placeholder="Ej: Matemáticas, Física, etc.">
                </div>

                <div class="input-group">
                    <label class="input-label">Motivo de la Falta *</label>
                    <textarea id="absence-reason" class="input-field" rows="4" placeholder="Describa el motivo por el cual faltó a clases..." required></textarea>
                </div>

                <div class="input-group">
                    <label class="input-label">Documento de Soporte (Opcional)</label>
                    <div style="background: var(--bg-soft); padding: 1rem; border-radius: 8px; border: 2px dashed var(--border-color); text-align: center;">
                        <i class="fa-solid fa-cloud-upload-alt" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
                        <p class="text-sm text-muted">Funcionalidad de subida de archivos en desarrollo</p>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">
                    <i class="fa-solid fa-paper-plane"></i> Enviar Solicitud
                </button>
            </form>
        </div>

        ${historyHtml}
    `;

    // Event handler para el formulario
    document.getElementById('justification-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('absence-date').value;
        const subject = document.getElementById('absence-subject').value.trim();
        const reason = document.getElementById('absence-reason').value.trim();

        // Validaciones
        if (!date) {
            showToast('Por favor seleccione la fecha de la falta', 'error');
            return;
        }

        if (!reason || reason.length < 10) {
            showToast('Por favor describa el motivo con al menos 10 caracteres', 'error');
            return;
        }

        // Deshabilitar botón mientras se procesa
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...';
        submitBtn.disabled = true;

        // Crear solicitud
        const result = await DB.createJustificationRequest({
            studentId: user.id,
            studentName: user.name,
            date: date,
            subject: subject,
            reason: reason,
            level: user.level || ''
        });

        if (result.success) {
            showToast('Solicitud enviada correctamente. El administrador la revisará pronto.', 'success');
            // Recargar la vista para mostrar la solicitud en el historial
            renderRequestJustification(user);
        } else {
            showToast('Error al enviar solicitud: ' + (result.error || 'Error desconocido'), 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}


// Lógica del Panel de Control Restaurada
async function renderHomeDashboard() {
    const user = Auth.currentUser;
    const esAdmin = user && user.role === 'admin';
    const esDocente = user && user.role === 'docente';

    // Obtener estadísticas reales de la base de datos
    const allUsers = await DB.getUsers();
    const totalAlumnos = allUsers.filter(u => u.role === 'alumno' && u.status === 'active').length;
    const totalDocentes = allUsers.filter(u => u.role === 'docente' && u.status === 'active').length;
    const totalTutores = allUsers.filter(u => u.role === 'tutor' && u.status === 'active').length;

    // Contenido del widget principal según el rol
    let widgetPrincipal = '';

    if (esAdmin) {
        // Para Admin: Solicitudes de justificantes pendientes
        const allRequests = await DB.getJustificationRequests();
        const solicitudesPendientes = allRequests.filter(r => r.status === 'Pendiente');
        const solicitudesRecientes = allRequests.slice(0, 5); // Las últimas 5

        let solicitudesRows = '';
        if (solicitudesRecientes.length === 0) {
            solicitudesRows = `<tr><td colspan="4" class="text-center text-muted">No hay solicitudes de justificantes</td></tr>`;
        } else {
            solicitudesRecientes.forEach(s => {
                const statusClass = s.status === 'Pendiente' ? 'text-warning' :
                    s.status === 'Aprobada' ? 'text-success' : 'text-error';
                const statusIcon = s.status === 'Pendiente' ? 'fa-clock' :
                    s.status === 'Aprobada' ? 'fa-check-circle' : 'fa-times-circle';
                solicitudesRows += `
                    <tr>
                        <td class="font-bold">${s.studentName || 'Sin nombre'}</td>
                        <td class="text-muted text-sm">${s.subject || '-'}</td>
                        <td class="text-sm">${s.absenceDate || '-'}</td>
                        <td><span class="${statusClass} font-bold text-sm"><i class="fa-solid ${statusIcon}"></i> ${s.status}</span></td>
                    </tr>
                `;
            });
        }

        widgetPrincipal = `
            <div class="card">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3>
                        <i class="fa-solid fa-file-medical"></i> Solicitudes de Justificantes
                        ${solicitudesPendientes.length > 0 ? `<span style="background: var(--warning-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">${solicitudesPendientes.length} pendiente${solicitudesPendientes.length !== 1 ? 's' : ''}</span>` : ''}
                    </h3>
                    <button class="btn btn-sm btn-primary" onclick="renderContent('absences')">
                        <i class="fa-solid fa-eye"></i> Ver Todas
                    </button>
                </div>
                
                <div style="overflow-x: auto; max-height: 280px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Materia</th>
                                <th>Fecha Falta</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${solicitudesRows}
                        </tbody>
                    </table>
                </div>
                ${solicitudesPendientes.length > 0 ? `
                <div style="margin-top: 1rem; padding: 0.75rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid var(--warning-color);">
                    <span class="text-warning font-bold"><i class="fa-solid fa-bell"></i> Tienes ${solicitudesPendientes.length} solicitud(es) pendiente(s) de revisión</span>
                </div>
                ` : ''}
            </div>
        `;
    } else if (esDocente) {
        // Para Docente: Vista rápida de grupos reales
        const allGroups = await DB.getGroups();
        // Buscar grupos por teacherId o por nivel
        let misGrupos = allGroups.filter(g => g.teacherId === user.id);
        if (misGrupos.length === 0 && user.level) {
            misGrupos = allGroups.filter(g => g.level === user.level);
        }

        const numGrupos = misGrupos.length;
        const listaGrupos = misGrupos.map(g => `Grupo ${g.name} - ${g.level}`).join(' | ') || 'Sin grupos asignados';

        widgetPrincipal = `
            <div class="card">
                <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                    <h3><i class="fa-solid fa-chalkboard-user"></i> Mis Grupos</h3>
                    <button class="btn btn-secondary text-sm" onclick="renderContent('grades')">Capturar Calificaciones</button>
                </div>
                
                <div class="text-center text-muted p-4" style="background: var(--bg-soft); border-radius: 8px;">
                     <i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                     <p>Tienes <strong>${numGrupos} grupo${numGrupos !== 1 ? 's' : ''}</strong> asignados este semestre.</p>
                     <p class="text-xs">${listaGrupos}</p>
                </div>
            </div>
        `;
    } else {
        // Para Alumnos/Tutores: Horario
        widgetPrincipal = `
            <div class="card">
                <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                    <h3>Horario (Vista Rápida)</h3>
                    <button class="btn btn-secondary text-sm" onclick="renderContent('schedule')">Ver Completo</button>
                </div>
                
                <div class="text-center text-muted p-4" style="background: var(--bg-soft); border-radius: 8px;">
                     <i class="fa-solid fa-calendar-check" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                     <p>Tu próxima clase es <strong>Matemáticas</strong> a las 7:00 AM</p>
                     <p class="text-xs">Recuerda llegar 5 minutos antes.</p>
                </div>
            </div>
        `;
    }

    // Obtener estado del periodo de inscripción
    const settings = await DB.getSettings();
    const periodoSuperiorActivo = settings.enrollmentPeriod === 'active';
    const periodoBasicoActivo = settings.enrollmentPeriodBasic === 'active';

    // Textos y Colores
    const estadoSuperior = periodoSuperiorActivo ? 'Abierto' : 'Cerrado';
    const colorSuperior = periodoSuperiorActivo ? 'text-success' : 'text-error';
    const estadoBasico = periodoBasicoActivo ? 'Abierto' : 'Cerrado';
    const colorBasico = periodoBasicoActivo ? 'text-success' : 'text-error';

    // Determinar qué periodos mostrar según el rol y nivel del usuario
    const esAlumno = user && user.role === 'alumno';
    // esDocente ya está declarado al inicio de la función
    const nivelUsuario = user?.level || '';
    const esNivelBasico = ['Kinder', 'Primaria', 'Secundaria'].includes(nivelUsuario);
    const esNivelSuperior = ['Preparatoria', 'Universidad'].includes(nivelUsuario);

    // Los alumnos y docentes solo ven su periodo correspondiente, otros roles (admin) ven ambos
    const tieneNivelAsignado = esAlumno || esDocente;
    const mostrarPeriodoBasico = !tieneNivelAsignado || esNivelBasico;
    const mostrarPeriodoSuperior = !tieneNivelAsignado || esNivelSuperior;

    mainContainer.innerHTML = `
        <!-- Stats Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card" style="border-left: 4px solid var(--primary-color);">
                <div class="text-muted text-sm font-bold">Total Alumnos</div>
                <div style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">${totalAlumnos}</div>
                <div class="text-muted text-sm">Estudiantes activos</div>
            </div>
            
            <div class="card" style="border-left: 4px solid var(--accent-color);">
                <div class="text-muted text-sm font-bold">Docentes Activos</div>
                <div style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">${totalDocentes}</div>
                <div class="text-muted text-sm">Profesores registrados</div>
            </div>

            ${mostrarPeriodoBasico ? `<div class="card" style="border-left: 4px solid var(--warning-color);">
                <div class="text-muted text-sm font-bold">Periodo Inscripción${esAlumno ? '' : ' (Básico)'}</div>
                <div style="font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0;" class="${colorBasico}">${estadoBasico}</div>
                <div class="text-xs text-muted mb-2">Kinder, Primaria, Secundaria (Bimestral)</div>
                ${esAdmin ? `<button id="btn-toggle-basic" class="btn btn-sm ${periodoBasicoActivo ? 'btn-warning' : 'btn-success'} w-full">
                    <i class="fa-solid ${periodoBasicoActivo ? 'fa-lock' : 'fa-lock-open'}"></i> ${periodoBasicoActivo ? 'Cerrar' : 'Abrir'}
                </button>` : ''}
            </div>` : ''}

            ${mostrarPeriodoSuperior ? `<div class="card" style="border-left: 4px solid #4ECDC4;">
                <div class="text-muted text-sm font-bold">Periodo Inscripción${esAlumno ? '' : ' (Superior)'}</div>
                <div style="font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0;" class="${colorSuperior}">${estadoSuperior}</div>
                <div class="text-xs text-muted mb-2">Preparatoria, Universidad (Semestral)</div>
                ${esAdmin ? `<button id="btn-toggle-higher" class="btn btn-sm ${periodoSuperiorActivo ? 'btn-warning' : 'btn-success'} w-full">
                    <i class="fa-solid ${periodoSuperiorActivo ? 'fa-lock' : 'fa-lock-open'}"></i> ${periodoSuperiorActivo ? 'Cerrar' : 'Abrir'}
                </button>` : ''}
            </div>` : ''}
        </div>


        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <!-- Main Widget (role-based) -->
            ${widgetPrincipal}

            <!-- Side Widget: Calendar -->
            <div class="card">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3 id="currentMonthYear">Diciembre 2025</h3>
                    <div class="flex gap-2">
                        <button id="prevMonth" class="btn btn-secondary" style="padding: 0.25rem 0.5rem;"><i class="fa-solid fa-chevron-left"></i></button>
                        <button id="nextMonth" class="btn btn-secondary" style="padding: 0.25rem 0.5rem;"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                <div id="calendarGrid">
                    <!-- Calendar Rendered by JS -->
                </div>
                <div class="text-center text-xs text-muted mt-2">RN-25: Sincronizado con SEP</div>
            </div>
        </div>
    `;

    // Initialize Calendar logic
    initCalendar();

    // Eventos para cambiar periodos de inscripción (solo admin)
    if (esAdmin) {
        const btnBasic = document.getElementById('btn-toggle-basic');
        const btnHigher = document.getElementById('btn-toggle-higher');

        if (btnBasic) {
            btnBasic.addEventListener('click', async () => {
                btnBasic.disabled = true;
                btnBasic.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
                const res = await DB.toggleEnrollmentPeriod('basic');
                if (res.success) {
                    showToast(res.message, 'success');
                    renderHomeDashboard();
                } else {
                    showToast('Error: ' + res.error, 'error');
                    btnBasic.disabled = false;
                }
            });
        }

        if (btnHigher) {
            btnHigher.addEventListener('click', async () => {
                btnHigher.disabled = true;
                btnHigher.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
                const res = await DB.toggleEnrollmentPeriod('higher');
                if (res.success) {
                    showToast(res.message, 'success');
                    renderHomeDashboard();
                } else {
                    showToast('Error: ' + res.error, 'error');
                    btnHigher.disabled = false;
                }
            });
        }
    }
}

// Lógica del Calendario (Portado desde script.js)
let currentDate = new Date();

function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    // Bind events if elements exist (they are dynamically added now)
    if (prevBtn) prevBtn.onclick = () => changeMonth(-1);
    if (nextBtn) nextBtn.onclick = () => changeMonth(1);

    renderCalendar();
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearLabel = document.getElementById('currentMonthYear');

    if (!calendarGrid || !monthYearLabel) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Nombres de Meses
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearLabel.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    let html = `
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted); font-weight: bold;">
            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; text-align: center;">
    `;

    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div></div>`;
    }

    const today = new Date();
    for (let i = 1; i <= lastDay; i++) {
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const style = isToday ?
            'background: var(--primary-color); color: white; border-radius: 50%; width: 30px; height: 30px; line-height: 30px; margin: 0 auto;' :
            'padding: 0.25rem; cursor: pointer; hover: background: #f1f5f9; border-radius: 4px;';

        html += `<div style="${style}">${i}</div>`;
    }

    html += `</div>`;
    calendarGrid.innerHTML = html;
}

// ============================================
// GESTIÓN DE GRUPOS (RF-2) - Admin
// ============================================
async function renderGroups() {
    pageTitle.textContent = 'Gestión de Grupos (RF-2)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando grupos...</div>';

    const [groups, users, subjects] = await Promise.all([
        DB.getGroups(),
        DB.getUsers(),
        DB.getSubjects()
    ]);

    const teachers = users.filter(u => u.role === ROLES.DOCENTE);

    // Crear mapa de materias por nivel
    const subjectsByLevel = {};
    subjects.forEach(s => {
        if (!subjectsByLevel[s.level]) subjectsByLevel[s.level] = [];
        subjectsByLevel[s.level].push(s);
    });
    const levels = ['Kinder', 'Primaria', 'Secundaria', 'Universidad'];

    // Colores por nivel para las franjas
    const levelColors = {
        'Kinder': '#ec4899',
        'Primaria': '#22c55e',
        'Secundaria': '#f59e0b',
        'Universidad': '#3b82f6'
    };

    let html = `
        <div class="card" style="margin-bottom: 1.5rem;">
            <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3><i class="fa-solid fa-users-rectangle"></i> Grupos Escolares</h3>
                <button class="btn btn-primary btn-add-group" id="btn-add-group">
                    <i class="fa-solid fa-plus"></i> Nuevo Grupo
                </button>
            </div>

            <!-- Formulario para agregar grupo (oculto inicialmente) -->
            <div id="group-form" style="display: none; background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Nuevo Grupo</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Nombre del Grupo</label>
                        <input type="text" id="group-name" class="input-field" placeholder="Ej: 1-A, 5CV1">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Nivel</label>
                        <select id="group-level" class="input-field">
                            ${levels.map(l => `<option value="${l}">${l}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Grado</label>
                        <input type="text" id="group-grade" class="input-field" placeholder="Ej: 1, 2, 3">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Sección</label>
                        <input type="text" id="group-section" class="input-field" placeholder="Ej: A, B, CV1">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Turno</label>
                        <select id="group-schedule" class="input-field">
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Nocturno">Nocturno</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Docente Titular</label>
                        <select id="group-teacher" class="input-field">
                            <option value="">-- Sin asignar --</option>
                            ${teachers.map(t => `<option value="${t.id}" data-name="${t.name}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" id="btn-save-group">Guardar Grupo</button>
                    <button class="btn btn-secondary" id="btn-cancel-group">Cancelar</button>
                </div>
            </div>

            <!-- Tabla de grupos por materia -->
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Nivel</th>
                            <th>Materia</th>
                            <th>Docente</th>
                            <th>Alumnos</th>
                            <th>Turno</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groups.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No hay grupos registrados</td></tr>' : ''}
                        ${groups.flatMap(g => {
        const levelSubjects = subjectsByLevel[g.level] || [];
        if (levelSubjects.length === 0) {
            return [`
                                    <tr style="border-left: 4px solid ${levelColors[g.level] || '#ccc'};">
                                        <td class="font-bold">${g.name}</td>
                                        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${g.level}</span></td>
                                        <td class="text-muted">Sin materias asignadas</td>
                                        <td>${g.teacherName || '<span class="text-muted">Sin asignar</span>'}</td>
                                        <td><span class="font-bold">${(g.studentIds || []).length}</span> alumnos</td>
                                        <td class="text-sm">${g.schedule || '-'}</td>
                                        <td>
                                            <div style="display: flex; gap: 0.25rem;">
                                                <button class="btn btn-sm btn-secondary btn-view-students" data-id="${g.id}" data-subject="" title="Ver Estudiantes">
                                                    <i class="fa-solid fa-users"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger btn-delete-group" data-id="${g.id}" title="Eliminar">
                                                    <i class="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `];
        }
        return levelSubjects.map((s, idx) => {
            const teacher = teachers.find(t => t.id === s.teacherId);
            return `
                                    <tr style="border-left: 4px solid ${levelColors[g.level] || '#ccc'};">
                                        <td class="font-bold">${g.name}</td>
                                        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${g.level}</span></td>
                                        <td><strong>${s.name}</strong></td>
                                        <td>${teacher ? teacher.name : (g.teacherName || '<span class="text-muted">Sin asignar</span>')}</td>
                                        <td><span class="font-bold">${(g.studentIds || []).length}</span> alumnos</td>
                                        <td class="text-sm">${g.schedule || '-'}</td>
                                        <td>
                                            <div style="display: flex; gap: 0.25rem;">
                                                <button class="btn btn-sm btn-secondary btn-view-students" data-id="${g.id}" data-subject="${s.name}" title="Ver Estudiantes de ${s.name}">
                                                    <i class="fa-solid fa-users"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger btn-delete-group" data-id="${g.id}" title="Eliminar Grupo">
                                                    <i class="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
        });
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Event: Mostrar formulario
    document.getElementById('btn-add-group').addEventListener('click', () => {
        document.getElementById('group-form').style.display = 'block';
    });

    // Event: Cancelar formulario
    document.getElementById('btn-cancel-group').addEventListener('click', () => {
        document.getElementById('group-form').style.display = 'none';
    });

    // Event: Guardar grupo
    document.getElementById('btn-save-group').addEventListener('click', async () => {
        const name = document.getElementById('group-name').value.trim();
        const level = document.getElementById('group-level').value;
        const grade = document.getElementById('group-grade').value.trim();
        const section = document.getElementById('group-section').value.trim();
        const schedule = document.getElementById('group-schedule').value;
        const teacherSelect = document.getElementById('group-teacher');
        const teacherId = teacherSelect.value;
        const teacherName = teacherSelect.options[teacherSelect.selectedIndex]?.dataset?.name || '';

        if (!name) {
            showToast('Ingrese un nombre para el grupo', 'error');
            return;
        }

        const result = await DB.createGroup({ name, level, grade, section, schedule, teacherId, teacherName });
        if (result.success) {
            showToast('Grupo creado correctamente', 'success');
            renderGroups();
        } else {
            showToast('Error al crear grupo: ' + (result.error || ''), 'error');
        }
    });

    // Event: Eliminar grupo
    document.querySelectorAll('.btn-delete-group').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('¿Está seguro de eliminar este grupo?')) {
                const id = btn.dataset.id;
                const result = await DB.deleteGroup(id);
                if (result.success) {
                    showToast('Grupo eliminado', 'success');
                    renderGroups();
                } else {
                    showToast('Error al eliminar', 'error');
                }
            }
        });
    });

    // Event: Ver estudiantes del grupo
    document.querySelectorAll('.btn-view-students').forEach(btn => {
        btn.addEventListener('click', async () => {
            const groupId = btn.dataset.id;
            const subjectName = btn.dataset.subject || '';
            const group = groups.find(g => g.id === groupId);
            if (!group) return;

            // Buscar la fila del grupo
            const groupRow = btn.closest('tr');

            // Si ya existe un panel abierto para este grupo, cerrarlo
            const existingPanel = document.getElementById(`students-panel-${groupId}-${subjectName.replace(/\s+/g, '-')}`);
            if (existingPanel) {
                existingPanel.remove();
                return;
            }

            // Cerrar otros paneles abiertos
            document.querySelectorAll('[id^="students-panel-"]').forEach(p => p.remove());

            const studentIds = group.studentIds || [];
            const groupStudents = users.filter(u => studentIds.includes(u.id));

            // Obtener calificaciones
            const grades = await DB.getGrades();
            const groupGrades = grades.filter(g => g.groupId === groupId);

            // Título del panel con materia
            const panelTitle = subjectName
                ? `Estudiantes de ${group.name} - ${subjectName}`
                : `Estudiantes de ${group.name}`;

            // Crear panel desplegable
            let panelContent = `
                <tr id="students-panel-${groupId}-${subjectName.replace(/\s+/g, '-')}">
                    <td colspan="7" style="padding: 0; background: var(--bg-secondary);">
                        <div style="padding: 1.5rem; border-top: 2px solid var(--primary-color);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h4 style="margin: 0;"><i class="fa-solid fa-users"></i> ${panelTitle}</h4>
                                <button class="btn btn-sm btn-secondary btn-close-panel" title="Cerrar">
                                    <i class="fa-solid fa-chevron-up"></i>
                                </button>
                            </div>

                ${groupStudents.length === 0 ? '<p class="text-muted text-center">No hay estudiantes inscritos en este grupo</p>' : `
                            <table style="margin: 0;">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Calificación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupStudents.map(s => {
                const studentGrade = groupGrades.find(g => g.studentId === s.id);
                const gradeValue = studentGrade?.grade || studentGrade?.average || '-';
                return `
                                        <tr data-student-id="${s.id}">
                                            <td class="text-muted text-sm">${s.id}</td>
                                            <td class="font-bold">${s.name}</td>
                                            <td>
                                                <input type="number" class="input-field student-grade-input" value="${gradeValue !== '-' ? gradeValue : ''}" min="0" max="100" placeholder="0-100" step="0.1" style="width: 80px; padding: 0.25rem 0.5rem;">
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-primary btn-save-grade" data-student-id="${s.id}" data-student-name="${s.name}" data-group-id="${groupId}">
                                                    <i class="fa-solid fa-save"></i> Guardar
                                                </button>
                                            </td>
                                        </tr>
                                        `;
            }).join('')}
                                </tbody>
                            </table>
                            `}
            </div>
        </td>
                </tr >
    `;

            // Insertar después de la fila del grupo
            groupRow.insertAdjacentHTML('afterend', panelContent);

            // Evento cerrar panel
            document.querySelector(`#students - panel - ${groupId} .btn - close - panel`).addEventListener('click', () => {
                document.getElementById(`students - panel - ${groupId} `).remove();
            });

            // Guardar calificación
            document.querySelectorAll(`#students - panel - ${groupId} .btn - save - grade`).forEach(saveBtn => {
                saveBtn.addEventListener('click', async () => {
                    const row = saveBtn.closest('tr');
                    const studentId = saveBtn.dataset.studentId;
                    const studentName = saveBtn.dataset.studentName;
                    const gradeInput = row.querySelector('.student-grade-input');
                    const gradeValue = parseFloat(gradeInput.value);

                    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
                        showToast('Ingrese una calificación válida (0-10)', 'error');
                        return;
                    }

                    // Formato correcto esperado por el API: array de objetos con p1, p2, p3, average
                    const result = await DB.saveGrades([{
                        studentId: studentId,
                        subject: group.name || 'General',
                        p1: gradeValue.toString(),
                        p2: '',
                        p3: '',
                        average: gradeValue.toString()
                    }]);

                    if (result.success) {
                        showToast(`Calificación guardada para ${studentName} `, 'success');
                    } else {
                        showToast('Error al guardar calificación: ' + (result.error || 'desconocido'), 'error');
                    }
                });
            });
        });
    });
}

// ============================================
// PASE DE LISTA / ASISTENCIA (RF-5) - Docente
// ============================================
async function renderAttendance(user) {
    pageTitle.textContent = 'Pase de Lista (RF-5)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando grupos...</div>';

    // Obtener grupos donde el docente está asignado o todos si es admin
    const [allGroups, allUsers] = await Promise.all([
        DB.getGroups(),
        DB.getUsers()
    ]);

    // Filtrar grupos del docente (por teacherId o por nivel del docente)
    let grupos = allGroups;
    if (user.role === 'docente') {
        grupos = allGroups.filter(g =>
            g.teacherId === user.id ||
            g.level === user.level
        );
    }

    // Obtener todos los alumnos
    const alumnos = allUsers.filter(u => u.role === 'alumno' && u.status === 'active');

    // Fecha de hoy por defecto
    const hoy = new Date().toISOString().split('T')[0];

    let html = `
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3><i class="fa-solid fa-clipboard-user"></i> Registro de Asistencia</h3>
            <p class="text-muted" style="margin-bottom: 1.5rem;">Seleccione un grupo y la fecha para registrar la asistencia de los alumnos.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="input-group">
                    <label class="input-label">Grupo</label>
                    <select id="attendance-group" class="input-field">
                        <option value="">-- Seleccione un grupo --</option>
                        ${grupos.map(g => `<option value="${g.id}" data-level="${g.level}">${g.name} - ${g.level}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">Fecha</label>
                    <input type="date" id="attendance-date" class="input-field" value="${hoy}" max="${hoy}">
                </div>
            </div>

            <div id="attendance-list-container">
                <div class="text-center text-muted p-4" style="background: var(--bg-soft); border-radius: 8px;">
                    <i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>Seleccione un grupo para cargar la lista de alumnos</p>
                </div>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    const groupSelect = document.getElementById('attendance-group');
    const dateInput = document.getElementById('attendance-date');
    const listContainer = document.getElementById('attendance-list-container');

    // Función para cargar alumnos del grupo
    async function loadGroupStudents() {
        const groupId = groupSelect.value;
        const date = dateInput.value;

        if (!groupId) {
            listContainer.innerHTML = `
                <div class="text-center text-muted p-4" style="background: var(--bg-soft); border-radius: 8px;">
                    <i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>Seleccione un grupo para cargar la lista de alumnos</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '<div class="text-center p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando alumnos...</div>';

        // Obtener el grupo seleccionado
        const grupo = grupos.find(g => g.id === groupId);
        if (!grupo) {
            listContainer.innerHTML = '<div class="text-center text-error p-4">Grupo no encontrado</div>';
            return;
        }

        // Obtener alumnos del grupo
        let alumnosDelGrupo = [];
        if (grupo.studentIds && grupo.studentIds.length > 0) {
            alumnosDelGrupo = alumnos.filter(a => grupo.studentIds.includes(a.id));
        } else {
            // Si el grupo no tiene alumnos asignados, mostrar alumnos del mismo nivel
            alumnosDelGrupo = alumnos.filter(a => a.level === grupo.level);
        }

        if (alumnosDelGrupo.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-muted p-4" style="background: var(--bg-soft); border-radius: 8px;">
                    <i class="fa-solid fa-user-slash" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No hay alumnos en este grupo</p>
                </div>
            `;
            return;
        }

        // Obtener asistencia existente para este grupo y fecha
        const existingAttendance = await DB.getAttendance({ groupId, date });

        // Crear mapa de asistencia existente
        const attendanceMap = {};
        existingAttendance.forEach(a => {
            attendanceMap[a.studentId] = a.status;
        });

        let tableHtml = `
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%;">Alumno</th>
                            <th class="text-center">Presente</th>
                            <th class="text-center">Ausente</th>
                            <th class="text-center">Tardanza</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-tbody">
        `;

        alumnosDelGrupo.forEach(alumno => {
            const currentStatus = attendanceMap[alumno.id] || 'Presente';
            tableHtml += `
                <tr class="attendance-row" data-student-id="${alumno.id}" data-student-name="${alumno.name}">
                    <td>
                        <div class="font-bold">${alumno.name}</div>
                        <div class="text-xs text-muted">${alumno.id}</div>
                    </td>
                    <td class="text-center">
                        <button class="btn-status btn-presente ${currentStatus === 'Presente' ? 'active' : ''}" data-status="Presente" title="Presente">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn-status btn-ausente ${currentStatus === 'Ausente' ? 'active' : ''}" data-status="Ausente" title="Ausente">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn-status btn-tardanza ${currentStatus === 'Tardanza' ? 'active' : ''}" data-status="Tardanza" title="Tardanza">
                            <i class="fa-solid fa-clock"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="btn-mark-all-present" class="btn btn-secondary">
                    <i class="fa-solid fa-check-double"></i> Marcar Todos Presente
                </button>
                <button id="btn-save-attendance" class="btn btn-primary">
                    <i class="fa-solid fa-save"></i> Guardar Asistencia
                </button>
            </div>

            <style>
                .btn-status {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid var(--border-color);
                    background: var(--bg-soft);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-status:hover {
                    transform: scale(1.1);
                }
                .btn-status.active {
                    color: white;
                }
                .btn-presente.active {
                    background: #22c55e;
                    border-color: #22c55e;
                }
                .btn-ausente.active {
                    background: #ef4444;
                    border-color: #ef4444;
                }
                .btn-tardanza.active {
                    background: #f59e0b;
                    border-color: #f59e0b;
                }
                .btn-justificado.active {
                    background: #3b82f6;
                    border-color: #3b82f6;
                }
            </style>
`;

        listContainer.innerHTML = tableHtml;

        // Event listeners para botones de estado
        document.querySelectorAll('.btn-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = btn.closest('.attendance-row');
                row.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Marcar todos presente
        document.getElementById('btn-mark-all-present').addEventListener('click', () => {
            document.querySelectorAll('.attendance-row').forEach(row => {
                row.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
                row.querySelector('.btn-presente').classList.add('active');
            });
            showToast('Todos marcados como Presente', 'info');
        });

        // Guardar asistencia
        document.getElementById('btn-save-attendance').addEventListener('click', async () => {
            const saveBtn = document.getElementById('btn-save-attendance');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
            saveBtn.disabled = true;

            const records = [];
            document.querySelectorAll('.attendance-row').forEach(row => {
                const studentId = row.dataset.studentId;
                const studentName = row.dataset.studentName;
                const activeBtn = row.querySelector('.btn-status.active');
                const status = activeBtn ? activeBtn.dataset.status : 'Presente';

                records.push({
                    studentId,
                    studentName,
                    status,
                    notes: ''
                });
            });

            const result = await DB.registerAttendance(groupId, date, records, user.id);

            if (result.success) {
                showToast('Asistencia guardada correctamente', 'success');
            } else {
                showToast('Error al guardar: ' + (result.error || 'Error desconocido'), 'error');
            }

            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        });
    }

    // Event listeners
    groupSelect.addEventListener('change', loadGroupStudents);
    dateInput.addEventListener('change', loadGroupStudents);
}


// ============================================
// GESTIÓN DE MATERIAS (RF-15) - Admin
// ============================================
async function renderSubjects() {
    pageTitle.textContent = 'Gestión de Materias (RF-15)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando materias...</div>';

    const [subjects, users, groups] = await Promise.all([
        DB.getSubjects(),
        DB.getUsers(),
        DB.getGroups()
    ]);

    const teachers = users.filter(u => u.role === 'docente');

    // Crear mapa de grupos por nivel
    const groupsByLevel = {};
    groups.forEach(g => {
        if (!groupsByLevel[g.level]) groupsByLevel[g.level] = [];
        groupsByLevel[g.level].push(g);
    });
    const levels = ['Kinder', 'Primaria', 'Secundaria', 'Universidad'];

    // Agrupar materias por nivel
    const subjectsByLevel = {};
    levels.forEach(level => {
        subjectsByLevel[level] = subjects.filter(s => s.level === level);
    });

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3><i class="fa-solid fa-book"></i> Catálogo de Materias por Nivel</h3>
                <button class="btn btn-primary" id="btn-add-subject">
                    <i class="fa-solid fa-plus"></i> Nueva Materia
                </button>
            </div>

            <!-- Formulario para agregar materia -->
            <div id="subject-form" style="display: none; background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Nueva Materia</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Nombre de la Materia</label>
                        <input type="text" id="subject-name" class="input-field" placeholder="Ej: Matemáticas">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Nivel</label>
                        <select id="subject-level" class="input-field">
                            ${levels.map(l => `<option value="${l}">${l}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Créditos</label>
                        <input type="number" id="subject-credits" class="input-field" value="4" min="1" max="12">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Docente</label>
                        <select id="subject-teacher" class="input-field">
                            <option value="">-- Sin asignar --</option>
                            ${teachers.map(t => `<option value="${t.id}">${t.name} (${t.level})</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label class="input-label">Descripción</label>
                        <textarea id="subject-description" class="input-field" rows="2" placeholder="Descripción de la materia"></textarea>
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" id="btn-save-subject">Guardar Materia</button>
                    <button class="btn btn-secondary" id="btn-cancel-subject">Cancelar</button>
                </div>
            </div>

            <!-- Materias agrupadas por nivel -->
    ${levels.map(level => {
        const levelSubjects = subjectsByLevel[level];
        const levelColors = {
            'Kinder': '#ec4899',
            'Primaria': '#22c55e',
            'Secundaria': '#f59e0b',
            'Universidad': '#3b82f6'
        };
        return `
                <div style="margin-bottom: 2rem;">
                    <h4 style="border-left: 4px solid ${levelColors[level]}; padding-left: 0.75rem; margin-bottom: 1rem;">
                        <i class="fa-solid fa-graduation-cap"></i> ${level}
                        <span class="text-muted text-sm" style="font-weight: normal;">(${levelSubjects.length} materias)</span>
                    </h4>
                    ${levelSubjects.length === 0 ? '<p class="text-muted text-sm" style="padding-left: 1rem;">No hay materias registradas para este nivel</p>' : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                        ${levelSubjects.map(s => {
            const teacher = teachers.find(t => t.id === s.teacherId);
            return `
                            <div class="card" style="background: var(--bg-secondary); margin: 0; border-left: 3px solid ${levelColors[level]};">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold">${s.name}</h4>
                                        <p class="text-sm text-muted">${s.description || 'Sin descripción'}</p>
                                    </div>
                                    <button class="btn btn-sm btn-danger btn-delete-subject" data-id="${s.id}">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                                <div style="margin-top: 1rem;" class="text-sm">
                                    <div><i class="fa-solid fa-chalkboard-user text-muted"></i> ${teacher ? teacher.name : '<span class="text-muted">Sin docente</span>'}</div>
                                    <div><i class="fa-solid fa-star text-muted"></i> <strong>${s.credits || 0}</strong> créditos</div>
                                    <div><i class="fa-solid fa-users-rectangle text-muted"></i> Grupo: <strong>${(groupsByLevel[level] && groupsByLevel[level].length > 0) ? groupsByLevel[level].map(g => g.name).join(', ') : '<span class="text-muted">Sin grupo</span>'}</strong></div>
                                </div>
                            </div>
                            `;
        }).join('')}
                    </div>
                    `}
                </div>
                `;
    }).join('')}
        </div>
    `;

    mainContainer.innerHTML = html;

    // Events
    document.getElementById('btn-add-subject').addEventListener('click', () => {
        document.getElementById('subject-form').style.display = 'block';
    });

    document.getElementById('btn-cancel-subject').addEventListener('click', () => {
        document.getElementById('subject-form').style.display = 'none';
    });

    document.getElementById('btn-save-subject').addEventListener('click', async () => {
        const name = document.getElementById('subject-name').value.trim();
        const level = document.getElementById('subject-level').value;
        const credits = parseInt(document.getElementById('subject-credits').value) || 4;
        const description = document.getElementById('subject-description').value.trim();
        const teacherId = document.getElementById('subject-teacher').value;

        if (!name) {
            showToast('Ingrese un nombre para la materia', 'error');
            return;
        }

        const result = await DB.createSubject({ name, level, credits, description, teacherId });
        if (result.success) {
            showToast('Materia creada correctamente', 'success');
            renderSubjects();
        } else {
            showToast('Error al crear materia', 'error');
        }
    });

    document.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('¿Eliminar esta materia?')) {
                const result = await DB.deleteSubject(btn.dataset.id);
                if (result.success) {
                    showToast('Materia eliminada', 'success');
                    renderSubjects();
                }
            }
        });
    });
}

// ============================================
// INSCRIPCIÓN ADMINISTRATIVA DE MATERIAS - Admin
// ============================================
async function renderAdminSubjectEnrollment() {
    pageTitle.textContent = 'Inscripción Administrativa de Materias';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando datos...</div>';

    // Obtener usuarios, materias y configuración
    const [users, allSubjects, settings] = await Promise.all([
        DB.getUsers(),
        DB.getSubjects(),
        DB.getSettings()
    ]);

    // Filtrar solo alumnos
    const students = users.filter(u => u.role === 'alumno');
    const levels = ['Kinder', 'Primaria', 'Secundaria', 'Universidad'];

    // Estado del periodo
    const periodoUniv = settings.enrollmentPeriod === 'active' ? 'Abierto' : 'Cerrado';
    const periodoBasico = settings.enrollmentPeriodBasic === 'active' ? 'Abierto' : 'Cerrado';

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3><i class="fa-solid fa-user-plus"></i> Inscribir Materias a Estudiantes</h3>
                <div class="text-sm">
                    <span class="text-muted">Periodo Básico: <strong>${periodoBasico}</strong></span> | 
                    <span class="text-muted">Periodo Universidad: <strong>${periodoUniv}</strong></span>
                </div>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid var(--primary-color); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <p class="text-sm"><strong>Nota:</strong> Como administrador, puede inscribir materias a cualquier estudiante sin importar el estado del periodo de inscripción.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="input-group">
                    <label class="input-label">Nivel Educativo</label>
                    <select id="admin-enroll-level" class="input-field">
                        <option value="">-- Seleccione nivel --</option>
                        ${levels.map(l => `<option value="${l}">${l}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">Estudiante</label>
                    <select id="admin-enroll-student" class="input-field" disabled>
                        <option value="">-- Seleccione nivel primero --</option>
                    </select>
                </div>
            </div>

            <div id="admin-enroll-subjects-container" style="display: none;">
                <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-book"></i> Materias Disponibles</h4>
                <div id="admin-enroll-subjects-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;"></div>
            </div>

            <div id="admin-enroll-current" style="display: none; margin-top: 1.5rem;">
                <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-clipboard-list"></i> Materias Inscritas del Estudiante</h4>
                <div id="admin-enroll-current-list"></div>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    const levelSelect = document.getElementById('admin-enroll-level');
    const studentSelect = document.getElementById('admin-enroll-student');
    const subjectsContainer = document.getElementById('admin-enroll-subjects-container');
    const subjectsList = document.getElementById('admin-enroll-subjects-list');
    const currentContainer = document.getElementById('admin-enroll-current');
    const currentList = document.getElementById('admin-enroll-current-list');

    // Al cambiar nivel, filtrar estudiantes
    levelSelect.addEventListener('change', () => {
        const selectedLevel = levelSelect.value;
        if (!selectedLevel) {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">-- Seleccione nivel primero --</option>';
            subjectsContainer.style.display = 'none';
            currentContainer.style.display = 'none';
            return;
        }

        // Filtrar estudiantes por nivel
        const filteredStudents = students.filter(s => s.level === selectedLevel);
        studentSelect.disabled = false;
        studentSelect.innerHTML = `
            <option value="">-- Seleccione estudiante --</option>
            ${filteredStudents.map(s => `<option value="${s.id}" data-level="${s.level}">${s.name} (${s.id})</option>`).join('')}
        `;
        subjectsContainer.style.display = 'none';
        currentContainer.style.display = 'none';
    });

    // Al seleccionar estudiante, cargar materias
    studentSelect.addEventListener('change', async () => {
        const studentId = studentSelect.value;
        const selectedLevel = levelSelect.value;
        if (!studentId || !selectedLevel) {
            subjectsContainer.style.display = 'none';
            currentContainer.style.display = 'none';
            return;
        }

        // Obtener inscripciones del estudiante
        const enrollments = await DB.getEnrollments(studentId);
        const activeEnrollments = enrollments.filter(e => e.status === 'Inscrito');
        const enrolledSubjectIds = activeEnrollments.map(e => e.subjectId);

        // Filtrar materias por nivelsoporta ambas estructuras)
        const levelSubjects = allSubjects.filter(s =>
            s.level === selectedLevel || (s.levels || []).includes(selectedLevel)
        );

        // Mostrar materias disponibles
        subjectsContainer.style.display = 'block';
        subjectsList.innerHTML = levelSubjects.length === 0 ?
            '<p class="text-muted">No hay materias disponibles para este nivel</p>' :
            levelSubjects.map(s => {
                const isEnrolled = enrolledSubjectIds.includes(s.id);
                return `
                    <div class="card" style="margin: 0; background: var(--bg-secondary); ${isEnrolled ? 'opacity: 0.6;' : ''}">
                        <h4 class="font-bold">${s.name}</h4>
                        <p class="text-sm text-muted">${s.description || 'Sin descripción'}</p>
                        <p class="text-sm"><strong>${s.credits || 0}</strong> créditos</p>
                        ${isEnrolled ?
                        `<button class="btn btn-sm btn-secondary w-full" disabled>
                                <i class="fa-solid fa-check"></i> Ya Inscrito
                            </button>` :
                        `<button class="btn btn-sm btn-primary w-full btn-admin-enroll" 
                                data-student-id="${studentId}" 
                                data-subject-id="${s.id}" 
                                data-subject-name="${s.name}"
                                data-credits="${s.credits || 0}">
                                <i class="fa-solid fa-plus"></i> Inscribir
                            </button>`
                    }
                    </div>
                `;
            }).join('');

        // Mostrar materias actuales
        currentContainer.style.display = 'block';
        currentList.innerHTML = activeEnrollments.length === 0 ?
            '<p class="text-muted">El estudiante no tiene materias inscritas</p>' :
            `<table>
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Créditos</th>
                        <th>Fecha</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${activeEnrollments.map(e => `
                        <tr>
                            <td class="font-bold">${e.subjectName}</td>
                            <td>${e.credits || 0}</td>
                            <td class="text-sm text-muted">${e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('es-MX') : '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-danger btn-admin-drop" data-id="${e.id}" data-name="${e.subjectName}">
                                    <i class="fa-solid fa-times"></i> Dar de Baja
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        // Event: Inscribir materia
        document.querySelectorAll('.btn-admin-enroll').forEach(btn => {
            btn.addEventListener('click', async () => {
                const sId = btn.dataset.subjectId;
                const sName = btn.dataset.subjectName;
                const stId = btn.dataset.studentId;
                const credits = parseInt(btn.dataset.credits) || 0;

                const result = await DB.enrollSubject({
                    studentId: stId,
                    subjectId: sId,
                    subjectName: sName,
                    credits: credits
                });

                if (result.success) {
                    showToast(`Materia "${sName}" inscrita correctamente`, 'success');
                    studentSelect.dispatchEvent(new Event('change')); // Recargar
                } else {
                    showToast(result.error || 'Error al inscribir materia', 'error');
                }
            });
        });

        // Event: Dar de baja materia
        document.querySelectorAll('.btn-admin-drop').forEach(btn => {
            btn.addEventListener('click', async () => {
                const enrollmentId = btn.dataset.id;
                const subjectName = btn.dataset.name;

                if (!confirm(`¿Dar de baja la materia "${subjectName}" ? `)) return;

                const result = await DB.dropSubject(enrollmentId, 'Baja administrativa');
                if (result.success) {
                    showToast(`Materia "${subjectName}" dada de baja`, 'success');
                    studentSelect.dispatchEvent(new Event('change')); // Recargar
                } else {
                    showToast(result.error || 'Error al dar de baja', 'error');
                }
            });
        });
    });
}


// ============================================
// MIS GRUPOS - Docente (RF-8)
// ============================================
async function renderMyGroups(user) {
    pageTitle.textContent = 'Mis Grupos Asignados (RF-8)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando grupos...</div>';

    // Obtener grupos asignados al docente (RN-8)
    // Primero busca por teacherId, si no encuentra, filtra por nivel del docente
    const allGroups = await DB.getGroups();
    let myGroups = allGroups.filter(g => g.teacherId === user.id);

    // Si no hay grupos por teacherId, buscar por nivel del docente
    if (myGroups.length === 0 && user.level) {
        myGroups = allGroups.filter(g => g.level === user.level);
    }
    const allUsers = await DB.getUsers();

    if (myGroups.length === 0) {
        mainContainer.innerHTML = `
            <div class="card text-center">
                <i class="fa-solid fa-chalkboard" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h3>Sin grupos asignados</h3>
                <p class="text-muted">Actualmente no tiene grupos asignados.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${myGroups.map(g => {
        const studentCount = (g.studentIds || []).length;
        const students = allUsers.filter(u => (g.studentIds || []).includes(u.id));
        return `
                    <div class="card" style="margin: 0;">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-bold">${g.name}</h3>
                                <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${g.level}</span>
                            </div>
                            <span class="text-lg font-bold">${studentCount}</span>
                        </div>
                        <p class="text-sm text-muted" style="margin-top: 0.5rem;">
                            Grado: ${g.grade || '-'} | Sección: ${g.section || '-'} | Turno: ${g.schedule || '-'}
                        </p>
                        
                        <div style="margin-top: 1rem;">
                            <p class="font-bold text-sm" style="margin-bottom: 0.5rem;">Alumnos:</p>
                            ${studentCount === 0 ? '<p class="text-muted text-sm">Sin alumnos inscritos</p>' : ''}
                            <ul style="list-style: none; padding: 0; margin: 0; max-height: 120px; overflow-y: auto;">
                                ${students.slice(0, 5).map(s => `
                                    <li class="text-sm" style="padding: 0.25rem 0;">
                                        <i class="fa-solid fa-user text-muted"></i> ${s.name}
                                    </li>
                                `).join('')}
                                ${studentCount > 5 ? `<li class="text-sm text-muted">...y ${studentCount - 5} más</li>` : ''}
                            </ul>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    mainContainer.innerHTML = html;
}

// ============================================
// REGISTRO DE INCIDENCIAS (RF-7) - Docente
// ============================================
async function renderIncidencias(user) {
    pageTitle.textContent = 'Registro de Incidencias (RF-7)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando...</div>';

    const [groups, allUsers, myIncidents] = await Promise.all([
        DB.getGroups(),
        DB.getUsers(),
        DB.getIncidents({ teacherId: user.id })
    ]);

    // Grupos del docente
    const myGroups = groups.filter(g => g.teacherId === user.id || g.level === user.level);
    const students = allUsers.filter(u => u.role === 'alumno' && u.status === 'active');

    let html = `
        <div class="card">
            <h3><i class="fa-solid fa-exclamation-circle" style="color: #f59e0b;"></i> Registrar Nueva Incidencia</h3>
            <p class="text-muted" style="margin-bottom: 1.5rem;">Complete el formulario para reportar una incidencia de conducta, retardo o falta de un alumno.</p>
            
            <form id="incident-form">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Grupo</label>
                        <select id="incident-group" class="input-field" required>
                            <option value="">-- Seleccione grupo --</option>
                            ${myGroups.map(g => `<option value="${g.id}" data-level="${g.level}">${g.name} - ${g.level}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Alumno</label>
                        <select id="incident-student" class="input-field" required disabled>
                            <option value="">-- Seleccione grupo primero --</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Tipo de Incidencia</label>
                        <select id="incident-type" class="input-field" required>
                            <option value="conducta">⚠️ Conducta</option>
                            <option value="retardo">⏰ Retardo</option>
                            <option value="falta">❌ Falta injustificada</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Severidad</label>
                        <select id="incident-severity" class="input-field" required>
                            <option value="leve">🟢 Leve</option>
                            <option value="moderada">🟡 Moderada</option>
                            <option value="grave">🔴 Grave</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Fecha</label>
                        <input type="date" id="incident-date" class="input-field" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Hora</label>
                        <input type="time" id="incident-time" class="input-field" value="${new Date().toTimeString().slice(0, 5)}" required>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label class="input-label">Descripción del incidente</label>
                        <textarea id="incident-description" class="input-field" rows="3" placeholder="Describa el incidente con detalle..." required></textarea>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <button type="submit" class="btn btn-warning" style="gap: 0.5rem;">
                        <i class="fa-solid fa-paper-plane"></i> Registrar Incidencia
                    </button>
                </div>
            </form>
        </div>

        <div class="card" style="margin-top: 1.5rem;">
            <h4><i class="fa-solid fa-history"></i> Mis Incidencias Registradas</h4>
            ${myIncidents.length === 0 ? '<p class="text-muted">No ha registrado incidencias aún.</p>' : `
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Alumno</th>
                            <th>Tipo</th>
                            <th>Severidad</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${myIncidents.map(i => `
                        <tr>
                            <td class="text-sm">${i.date}</td>
                            <td class="font-bold">${i.studentName}</td>
                            <td><span class="text-sm">${i.type === 'conducta' ? '⚠️' : i.type === 'retardo' ? '⏰' : '❌'} ${i.type}</span></td>
                            <td><span class="${i.severity === 'grave' ? 'text-error' : i.severity === 'moderada' ? 'text-warning' : 'text-success'}">${i.severity}</span></td>
                            <td><span class="text-sm ${i.status === 'sancionada' ? 'text-error' : i.status === 'revisada' ? 'text-success' : 'text-warning'}">${i.status}</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `}
        </div>
    `;

    mainContainer.innerHTML = html;

    // Event: Cambio de grupo carga alumnos
    const groupSelect = document.getElementById('incident-group');
    const studentSelect = document.getElementById('incident-student');

    groupSelect.addEventListener('change', () => {
        const groupId = groupSelect.value;
        if (!groupId) {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">-- Seleccione grupo primero --</option>';
            return;
        }

        const group = myGroups.find(g => g.id === groupId);
        let groupStudents = [];
        if (group.studentIds && group.studentIds.length > 0) {
            groupStudents = students.filter(s => group.studentIds.includes(s.id));
        } else {
            groupStudents = students.filter(s => s.level === group.level);
        }

        studentSelect.disabled = false;
        studentSelect.innerHTML = `
            <option value="">-- Seleccione alumno --</option>
            ${groupStudents.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name}</option>`).join('')}
        `;
    });

    // Event: Submit form
    document.getElementById('incident-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

        const studentId = studentSelect.value;
        const studentName = studentSelect.options[studentSelect.selectedIndex].dataset.name;
        const groupId = groupSelect.value;
        const group = myGroups.find(g => g.id === groupId);

        const incidentData = {
            studentId,
            studentName,
            teacherId: user.id,
            teacherName: user.name,
            type: document.getElementById('incident-type').value,
            severity: document.getElementById('incident-severity').value,
            description: document.getElementById('incident-description').value,
            date: document.getElementById('incident-date').value,
            time: document.getElementById('incident-time').value,
            level: group?.level || '',
            groupId
        };

        const result = await DB.createIncident(incidentData);
        if (result.success) {
            showToast('Incidencia registrada correctamente', 'success');
            renderIncidencias(user);
        } else {
            showToast(result.error || 'Error al registrar incidencia', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Registrar Incidencia';
        }
    });
}

// ============================================
// GESTIÓN DE INCIDENCIAS (RF-3) - Admin
// ============================================
async function renderAdminIncidencias() {
    pageTitle.textContent = 'Gestión de Incidencias (RF-3)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando incidencias...</div>';

    const [incidents, stats] = await Promise.all([
        DB.getIncidents(),
        DB.getIncidentStats()
    ]);

    // Ordenar por fecha más reciente
    incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="margin: 0; text-align: center; border-top: 3px solid var(--primary-color);">
                <div style="font-size: 2rem; font-weight: bold;">${stats.total || 0}</div>
                <div class="text-sm text-muted">Total</div>
            </div>
            <div class="card" style="margin: 0; text-align: center; border-top: 3px solid #f59e0b;">
                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${stats.pendientes || 0}</div>
                <div class="text-sm text-muted">Pendientes</div>
            </div>
            <div class="card" style="margin: 0; text-align: center; border-top: 3px solid #f59e0b;">
                <div style="font-size: 2rem; font-weight: bold;">${stats.conducta || 0}</div>
                <div class="text-sm text-muted">Conducta</div>
            </div>
            <div class="card" style="margin: 0; text-align: center; border-top: 3px solid #3b82f6;">
                <div style="font-size: 2rem; font-weight: bold;">${stats.retardo || 0}</div>
                <div class="text-sm text-muted">Retardos</div>
            </div>
            <div class="card" style="margin: 0; text-align: center; border-top: 3px solid #ef4444;">
                <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${stats.sancionadas || 0}</div>
                <div class="text-sm text-muted">Sancionadas</div>
            </div>
        </div>

        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3><i class="fa-solid fa-exclamation-triangle" style="color: #f59e0b;"></i> Todas las Incidencias</h3>
                <select id="filter-status" class="input-field" style="width: auto;">
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="revisada">Revisadas</option>
                    <option value="sancionada">Sancionadas</option>
                </select>
            </div>

            ${incidents.length === 0 ? '<p class="text-muted text-center">No hay incidencias registradas.</p>' : `
            <div style="overflow-x: auto;">
                <table id="incidents-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Alumno</th>
                            <th>Nivel</th>
                            <th>Tipo</th>
                            <th>Severidad</th>
                            <th>Docente</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incidents.map(i => `
                        <tr data-status="${i.status}">
                            <td class="text-sm">${i.date}</td>
                            <td class="font-bold">${i.studentName}</td>
                            <td class="text-sm">${i.level || '-'}</td>
                            <td>
                                <span class="text-sm">
                                    ${i.type === 'conducta' ? '⚠️' : i.type === 'retardo' ? '⏰' : '❌'} ${i.type}
                                </span>
                            </td>
                            <td>
                                <span class="${i.severity === 'grave' ? 'text-error font-bold' : i.severity === 'moderada' ? 'text-warning' : 'text-success'}">
                                    ${i.severity}
                                </span>
                            </td>
                            <td class="text-sm text-muted">${i.teacherName || '-'}</td>
                            <td>
                                <span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; 
                                    background: ${i.status === 'sancionada' ? '#fee2e2' : i.status === 'revisada' ? '#d1fae5' : '#fef3c7'};
                                    color: ${i.status === 'sancionada' ? '#dc2626' : i.status === 'revisada' ? '#059669' : '#d97706'};">
                                    ${i.status}
                                </span>
                            </td>
                            <td>
                                ${i.status === 'pendiente' ? `
                                <div style="display: flex; gap: 0.25rem;">
                                    <button class="btn btn-sm btn-success btn-review" data-id="${i.id}" title="Marcar como revisada">
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger btn-sanction" data-id="${i.id}" data-student="${i.studentName}" title="Aplicar sanción">
                                        <i class="fa-solid fa-gavel"></i>
                                    </button>
                                </div>
                                ` : i.status === 'revisada' ? `
                                <button class="btn btn-sm btn-danger btn-sanction" data-id="${i.id}" data-student="${i.studentName}" title="Aplicar sanción">
                                    <i class="fa-solid fa-gavel"></i> Sancionar
                                </button>
                                ` : `
                                <span class="text-sm text-muted"><i class="fa-solid fa-lock"></i> Cerrado</span>
                                `}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `}
        </div>
    `;

    mainContainer.innerHTML = html;

    // Filter by status
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
        const filterVal = e.target.value;
        document.querySelectorAll('#incidents-table tbody tr').forEach(row => {
            if (!filterVal || row.dataset.status === filterVal) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Review incident
    document.querySelectorAll('.btn-review').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const result = await DB.reviewIncident(id, 'Incidencia revisada por administrador', 'revisada');
            if (result.success) {
                showToast('Incidencia marcada como revisada', 'success');
                renderAdminIncidencias();
            } else {
                showToast(result.error || 'Error al revisar', 'error');
            }
        });
    });

    // Apply sanction
    document.querySelectorAll('.btn-sanction').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const studentName = btn.dataset.student;
            const sanctionDesc = prompt(`Describa la sanción para ${studentName}:`);
            if (!sanctionDesc) return;

            const result = await DB.applySanction(id, {
                sanctionType: 'suspension',
                sanctionDescription: sanctionDesc,
                adminId: Auth.currentUser?.id
            });

            if (result.success) {
                showToast('Sanción aplicada', 'success');
                renderAdminIncidencias();
            } else {
                showToast(result.error || 'Error al aplicar sanción', 'error');
            }
        });
    });
}

// ============================================
// RF-13: MODAL DE RECUPERACIÓN DE CONTRASEÑA
// ============================================
function showPasswordRecoveryModal() {
    // Remover modal existente si hay
    document.getElementById('recovery-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'recovery-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-key"></i> Recuperar Contraseña</h3>
            
            <div id="recovery-step-1">
                <p class="text-muted" style="margin-bottom: 1.5rem;">Ingresa tu correo institucional para recibir un enlace de recuperación.</p>
                <form id="recovery-email-form">
                    <div class="input-group">
                        <label class="input-label">Correo Electrónico</label>
                        <input type="email" id="recovery-email" class="input-field" placeholder="usuario@schoolhub.edu.mx" required>
                    </div>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancel-recovery" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-paper-plane"></i> Enviar
                        </button>
                    </div>
                </form>
            </div>
            
            <div id="recovery-step-2" style="display: none;">
                <p class="text-success" style="margin-bottom: 1rem;"><i class="fa-solid fa-check-circle"></i> Token generado</p>
                <p class="text-muted" style="margin-bottom: 1rem;">Ingresa el token y tu nueva contraseña:</p>
                <form id="recovery-reset-form">
                    <div class="input-group">
                        <label class="input-label">Token de Recuperación</label>
                        <input type="text" id="recovery-token" class="input-field" placeholder="Pega el token aquí" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Nueva Contraseña</label>
                        <input type="password" id="new-password" class="input-field" placeholder="Mínimo 9 caracteres" required>
                        <div id="password-strength" style="margin-top: 0.5rem; font-size: 0.8rem;"></div>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Confirmar Contraseña</label>
                        <input type="password" id="confirm-password" class="input-field" placeholder="Repetir contraseña" required>
                    </div>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancel-reset" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-check"></i> Cambiar Contraseña
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Event: Cancel
    document.getElementById('cancel-recovery').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-reset')?.addEventListener('click', () => modal.remove());

    // Event: Request token
    document.getElementById('recovery-email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        const result = await DB.requestPasswordRecovery(email);

        if (result.success && result.token) {
            // Mostrar step 2 con token pre-llenado para desarrollo
            document.getElementById('recovery-step-1').style.display = 'none';
            document.getElementById('recovery-step-2').style.display = 'block';
            document.getElementById('recovery-token').value = result.token;
            showToast('Token generado. Expira en 15 minutos.', 'success');
        } else {
            showToast(result.message || 'Revisa tu correo', 'info');
            modal.remove();
        }
    });

    // Event: Password input - validation visual
    document.getElementById('new-password')?.addEventListener('input', (e) => {
        const password = e.target.value;
        const strengthDiv = document.getElementById('password-strength');
        strengthDiv.innerHTML = getPasswordStrengthHTML(password);
    });

    // Event: Reset password
    document.getElementById('recovery-reset-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('recovery-token').value;
        const password = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (password !== confirm) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        const validation = Auth.validatePassword(password);
        if (!validation.valid) {
            showToast(validation.error, 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cambiando...';

        const result = await DB.resetPassword(token, password);

        if (result.success) {
            showToast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
            modal.remove();
        } else {
            showToast(result.error || 'Error al cambiar contraseña', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Cambiar Contraseña';
        }
    });
}

// RN-8: Visualización de requisitos de contraseña
function getPasswordStrengthHTML(password) {
    const checks = [
        { test: password.length >= 9, label: '9+ caracteres' },
        { test: /[A-Z]/.test(password), label: 'Mayúscula' },
        { test: /[a-z]/.test(password), label: 'Minúscula' },
        { test: /[0-9]/.test(password), label: 'Número' },
        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Símbolo' }
    ];

    return checks.map(c => `
        <span style="color: ${c.test ? '#10b981' : '#ef4444'}; margin-right: 8px;">
            <i class="fa-solid ${c.test ? 'fa-check' : 'fa-times'}"></i> ${c.label}
        </span>
    `).join('');
}

// ============================================
// RF-9: PERFIL DE ALUMNO UNIVERSITARIO
// ============================================
async function renderStudentProfile(user) {
    pageTitle.textContent = 'Mi Perfil (RF-9)';
    mainContainer.innerHTML = '<div class="card text-center">Cargando perfil...</div>';

    const html = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-color); color: white; 
                    display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <h2 style="margin: 0;">${user.name}</h2>
                <p class="text-muted">${user.email}</p>
                <span style="background: var(--accent-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem;">
                    ${user.level} | Boleta: ${user.id}
                </span>
            </div>
            
            <form id="profile-form">
                <div style="display: grid; gap: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Teléfono</label>
                        <input type="tel" id="profile-phone" class="input-field" value="${user.phone || ''}" placeholder="10 dígitos">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Dirección</label>
                        <input type="text" id="profile-address" class="input-field" value="${user.address || ''}" placeholder="Calle, número, colonia, ciudad">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Email Alternativo</label>
                        <input type="email" id="profile-alt-email" class="input-field" value="${user.alternateEmail || ''}" placeholder="correo@personal.com">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Contacto de Emergencia</label>
                        <input type="text" id="profile-emergency" class="input-field" value="${user.emergencyContact || ''}" placeholder="Nombre y teléfono">
                    </div>
                </div>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
        
        <div class="card" style="max-width: 600px; margin: 1.5rem auto 0;">
            <h4><i class="fa-solid fa-shield-halved"></i> Seguridad</h4>
            <p class="text-muted">Cambia tu contraseña regularmente para mayor seguridad.</p>
            <button id="change-password-btn" class="btn btn-secondary" style="margin-top: 1rem;">
                <i class="fa-solid fa-key"></i> Cambiar Contraseña
            </button>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Event: Save profile
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const result = await DB.updateProfile(user.id, {
            phone: document.getElementById('profile-phone').value,
            address: document.getElementById('profile-address').value,
            alternateEmail: document.getElementById('profile-alt-email').value,
            emergencyContact: document.getElementById('profile-emergency').value
        });

        if (result.success) {
            showToast('Perfil actualizado correctamente', 'success');
        } else {
            showToast(result.error || 'Error al guardar', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
    });

    // Event: Change password
    document.getElementById('change-password-btn').addEventListener('click', () => {
        showPasswordRecoveryModal();
        // Pre-fill email
        setTimeout(() => {
            const emailInput = document.getElementById('recovery-email');
            if (emailInput) emailInput.value = user.email;
        }, 100);
    });
}

// ============================================
// RF-5: Asignación Manual de Materias a Docentes
// RN-1: Validación de Carga Mínima (4 materias)
// ============================================
async function renderAssignSubjects() {
    pageTitle.textContent = 'Asignar Materias a Docentes (RF-5)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando asignaciones...</div>';

    // Obtener datos
    const [assignments, subjects] = await Promise.all([
        DB.getTeacherSubjectAssignments(),
        DB.getSubjects()
    ]);

    // Contar estadísticas
    const totalTeachers = assignments.length;
    const teachersWithFullLoad = assignments.filter(a => a.meetsMinimum).length;
    const teachersWithLowLoad = totalTeachers - teachersWithFullLoad;

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3><i class="fa-solid fa-link"></i> Asignación de Materias a Docentes</h3>
                <div style="display: flex; gap: 1rem;">
                    <span class="badge" style="background: #22c55e; color: white; padding: 0.5rem 1rem; border-radius: 8px;">
                        <i class="fa-solid fa-check-circle"></i> ${teachersWithFullLoad} con carga completa
                    </span>
                    <span class="badge" style="background: #f59e0b; color: white; padding: 0.5rem 1rem; border-radius: 8px;">
                        <i class="fa-solid fa-exclamation-triangle"></i> ${teachersWithLowLoad} con carga incompleta
                    </span>
                </div>
            </div>

            <!-- Info RN-1 -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
                <strong><i class="fa-solid fa-info-circle"></i> RN-1: Carga Mínima Docente</strong>
                <p style="margin: 0.5rem 0 0;">Cada docente debe tener asignadas al menos <strong>4 materias</strong> para cumplir con la distribución académica.</p>
            </div>

            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>Especialidad</th>
                            <th>Nivel</th>
                            <th style="text-align: center;">Materias Asignadas</th>
                            <th style="text-align: center;">Estado RN-1</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (assignments.length === 0) {
        html += `<tr><td colspan="6" class="text-center text-muted">No hay docentes registrados</td></tr>`;
    } else {
        assignments.forEach(t => {
            const statusClass = t.meetsMinimum ? 'text-success' : 'text-warning';
            const statusIcon = t.meetsMinimum ? 'fa-check-circle' : 'fa-exclamation-triangle';
            const statusText = t.meetsMinimum ? 'Cumple' : `Faltan ${4 - t.subjectCount}`;

            html += `
                <tr data-teacher-id="${t.teacherId}">
                    <td class="font-bold">${t.teacherName}</td>
                    <td class="text-muted">${t.specialty || '-'}</td>
                    <td>${t.level || '-'}</td>
                    <td style="text-align: center;">
                        <span style="font-size: 1.2rem; font-weight: bold; ${t.meetsMinimum ? 'color: #22c55e;' : 'color: #f59e0b;'}">
                            ${t.subjectCount}/4+
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <span class="${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i> ${statusText}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-manage-subjects" data-id="${t.teacherId}" data-name="${t.teacherName}">
                            <i class="fa-solid fa-cog"></i> Gestionar
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Event: Gestionar materias de un docente
    document.querySelectorAll('.btn-manage-subjects').forEach(btn => {
        btn.addEventListener('click', async () => {
            const teacherId = btn.getAttribute('data-id');
            const teacherName = btn.getAttribute('data-name');
            await showTeacherSubjectsModal(teacherId, teacherName, subjects);
        });
    });
}

// Modal para gestionar materias de un docente
async function showTeacherSubjectsModal(teacherId, teacherName, allSubjects) {
    // Obtener carga actual del docente
    const teacherLoad = await DB.getTeacherLoad(teacherId);

    // Materias ya asignadas a este docente
    const assignedIds = teacherLoad.subjects.map(s => s.subjectId);

    // Materias disponibles (no asignadas a nadie o asignadas a este docente para remover)
    const available = allSubjects.filter(s =>
        s.status === 'active' && !assignedIds.includes(s.id)
    );

    const modalHtml = `
        <div id="assign-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3><i class="fa-solid fa-user-tie"></i> ${teacherName}</h3>
                    <button id="close-modal-btn" class="btn btn-secondary btn-sm">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <!-- Estado actual -->
                <div style="background: ${teacherLoad.meetsMinimum ? '#dcfce7' : '#fef3c7'}; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>Carga actual: ${teacherLoad.count}/4 materias</strong>
                    ${!teacherLoad.meetsMinimum ? '<span style="color: #f59e0b; margin-left: 1rem;"><i class="fa-solid fa-exclamation-triangle"></i> No cumple RN-1</span>' : '<span style="color: #22c55e; margin-left: 1rem;"><i class="fa-solid fa-check-circle"></i> Cumple RN-1</span>'}
                </div>

                <!-- Materias asignadas -->
                <h4 style="margin-bottom: 0.5rem;"><i class="fa-solid fa-book"></i> Materias Asignadas</h4>
                <div id="assigned-subjects" style="margin-bottom: 1.5rem;">
                    ${teacherLoad.subjects.length === 0 ? '<p class="text-muted">No tiene materias asignadas</p>' : ''}
                    ${teacherLoad.subjects.map(s => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f1f5f9; border-radius: 6px; margin-bottom: 0.5rem;">
                            <span>${s.subjectName}</span>
                            <button class="btn btn-sm btn-danger btn-remove-subject" data-assignment-id="${s.id}" data-subject-name="${s.subjectName}">
                                <i class="fa-solid fa-minus"></i> Quitar
                            </button>
                        </div>
                    `).join('')}
                </div>

                <!-- Agregar nueva materia -->
                <h4 style="margin-bottom: 0.5rem;"><i class="fa-solid fa-plus-circle"></i> Agregar Materia</h4>
                <div style="display: flex; gap: 0.5rem;">
                    <select id="subject-to-add" class="input-field" style="flex: 1;">
                        <option value="">-- Seleccionar materia --</option>
                        ${available.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name} (${s.level || 'General'})</option>`).join('')}
                    </select>
                    <button id="btn-add-subject" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('assign-modal');

    // Event: Cerrar modal
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.remove();
        renderAssignSubjects(); // Refrescar lista
    });

    // Event: Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            renderAssignSubjects();
        }
    });

    // Event: Quitar materia
    document.querySelectorAll('.btn-remove-subject').forEach(btn => {
        btn.addEventListener('click', async () => {
            const assignmentId = btn.getAttribute('data-assignment-id');
            const subjectName = btn.getAttribute('data-subject-name');

            if (!confirm(`¿Desea quitar la materia "${subjectName}" de este docente?`)) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const result = await DB.unassignSubjectFromTeacher(assignmentId);

            if (result.success) {
                showToast('Materia desasignada', 'success');
                if (result.warning) {
                    showToast(result.warning, 'warning');
                }
                modal.remove();
                await showTeacherSubjectsModal(teacherId, teacherName, allSubjects);
            } else {
                showToast(result.error || 'Error al desasignar', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-minus"></i> Quitar';
            }
        });
    });

    // Event: Agregar materia
    document.getElementById('btn-add-subject').addEventListener('click', async () => {
        const select = document.getElementById('subject-to-add');
        const subjectId = select.value;
        const subjectName = select.options[select.selectedIndex]?.getAttribute('data-name') || '';

        if (!subjectId) {
            showToast('Seleccione una materia', 'warning');
            return;
        }

        const btn = document.getElementById('btn-add-subject');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const result = await DB.assignSubjectToTeacher(teacherId, subjectId, subjectName);

        if (result.success) {
            showToast('Materia asignada correctamente', 'success');
            modal.remove();
            await showTeacherSubjectsModal(teacherId, teacherName, allSubjects);
        } else {
            showToast(result.error || 'Error al asignar', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar';
        }
    });
}

// ============================================
// RN-4: Gestión de Vacantes (Materias sin Docente)
// ============================================
async function renderVacancies() {
    pageTitle.textContent = 'Materias Vacantes (RN-4)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando vacantes...</div>';

    const [vacancies, subjects, assignments] = await Promise.all([
        DB.getVacancies(),
        DB.getSubjects(),
        DB.getTeacherSubjectAssignments()
    ]);

    // Recopilar IDs de materias asignadas (de teacherSubjects)
    const assignedSubjectIds = [];
    assignments.forEach(a => {
        if (a.subjects && a.subjects.length > 0) {
            a.subjects.forEach(s => assignedSubjectIds.push(s.subjectId));
        }
    });

    // Materias sin docente = sin teacherId directo Y sin asignación en teacherSubjects
    const unassignedSubjects = subjects.filter(s => {
        const isActive = (s.status ?? 'active') === 'active';
        const hasDirectTeacher = !!(s.teacherId);
        const hasAssignment = assignedSubjectIds.includes(s.id);

        return isActive && !hasDirectTeacher && !hasAssignment;
    });

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3><i class="fa-solid fa-user-xmark"></i> Materias sin Docente Asignado</h3>
                <span style="background: ${unassignedSubjects.length > 0 ? '#fee2e2' : '#dcfce7'}; color: ${unassignedSubjects.length > 0 ? '#dc2626' : '#16a34a'}; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold;">
                    ${unassignedSubjects.length} ${unassignedSubjects.length === 1 ? 'vacante' : 'vacantes'}
                </span>
            </div>

            <!-- Info RN-4 -->
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
                <strong><i class="fa-solid fa-info-circle"></i> RN-4: Manejo de Vacantes</strong>
                <p style="margin: 0.5rem 0 0;">Las materias sin docente asignado deben ser cubiertas. Si no hay docentes disponibles, se genera una vacante para contratar personal.</p>
            </div>
    `;

    if (unassignedSubjects.length === 0) {
        html += `
            <div style="text-align: center; padding: 3rem;">
                <i class="fa-solid fa-check-circle" style="font-size: 3rem; color: #22c55e;"></i>
                <h4 style="margin-top: 1rem;">¡Sin Vacantes!</h4>
                <p class="text-muted">Todas las materias tienen un docente asignado.</p>
            </div>
        `;
    } else {
        html += `
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Nivel</th>
                            <th>Créditos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        unassignedSubjects.forEach(s => {
            html += `
                <tr>
                    <td class="font-bold">
                        <i class="fa-solid fa-book text-muted"></i> ${s.name}
                    </td>
                    <td>${s.level || 'General'}</td>
                    <td>${s.credits || 7}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-quick-assign" data-id="${s.id}" data-name="${s.name}">
                            <i class="fa-solid fa-user-plus"></i> Asignar Docente
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    html += `</div>`;

    mainContainer.innerHTML = html;

    // Event: Asignación rápida
    document.querySelectorAll('.btn-quick-assign').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.getAttribute('data-id');
            const subjectName = btn.getAttribute('data-name');
            await showQuickAssignModal(subjectId, subjectName, assignments);
        });
    });
}

// Modal de asignación rápida desde vacantes
async function showQuickAssignModal(subjectId, subjectName, assignments) {
    // Ordenar docentes por carga (menor primero, para cumplir RN-4)
    const sortedTeachers = [...assignments].sort((a, b) => a.subjectCount - b.subjectCount);

    const modalHtml = `
        <div id="quick-assign-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="max-width: 500px; width: 90%;">
                <h3><i class="fa-solid fa-user-plus"></i> Asignar Docente</h3>
                <p style="margin: 1rem 0;">Asignar <strong>${subjectName}</strong> a:</p>

                <div style="margin-bottom: 1rem; background: #e0f2fe; padding: 0.75rem; border-radius: 6px;">
                    <small><i class="fa-solid fa-lightbulb"></i> <strong>RN-4:</strong> Se recomienda asignar al docente con menor carga actual.</small>
                </div>

                <select id="teacher-select" class="input-field" style="margin-bottom: 1rem;">
                    <option value="">-- Seleccionar docente --</option>
                    ${sortedTeachers.map(t => `
                        <option value="${t.teacherId}">
                            ${t.teacherName} (${t.subjectCount} materias) ${!t.meetsMinimum ? '⚠️' : '✓'}
                        </option>
                    `).join('')}
                </select>

                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button id="cancel-quick-assign" class="btn btn-secondary">Cancelar</button>
                    <button id="confirm-quick-assign" class="btn btn-primary">
                        <i class="fa-solid fa-check"></i> Asignar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('quick-assign-modal');

    // Cerrar modal
    document.getElementById('cancel-quick-assign').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Confirmar asignación
    document.getElementById('confirm-quick-assign').addEventListener('click', async () => {
        const teacherId = document.getElementById('teacher-select').value;
        if (!teacherId) {
            showToast('Seleccione un docente', 'warning');
            return;
        }

        const btn = document.getElementById('confirm-quick-assign');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const result = await DB.assignSubjectToTeacher(teacherId, subjectId, subjectName);

        if (result.success) {
            showToast('Materia asignada correctamente', 'success');
            modal.remove();
            renderVacancies(); // Actualizar lista
        } else {
            showToast(result.error || 'Error al asignar', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Asignar';
        }
    });
}

// ============================================
// RF-2: Gestión de Talleres y Optativas
// ============================================
async function renderWorkshops() {
    pageTitle.textContent = 'Talleres y Optativas (RF-2)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando talleres...</div>';

    const workshops = await DB.getWorkshops();

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3><i class="fa-solid fa-palette"></i> Gestión de Talleres y Optativas</h3>
                <button id="btn-new-workshop" class="btn btn-primary">
                    <i class="fa-solid fa-plus"></i> Nuevo Taller
                </button>
            </div>

            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
                <strong><i class="fa-solid fa-info-circle"></i> RF-2: Verificación de Talleres</strong>
                <p style="margin: 0.5rem 0 0;">Los talleres deben ser verificados antes de habilitarse. Se requiere docente asignado y horario definido.</p>
            </div>

            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Nivel</th>
                            <th>Créditos</th>
                            <th>Capacidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (workshops.length === 0) {
        html += `<tr><td colspan="7" class="text-center text-muted">No hay talleres registrados</td></tr>`;
    } else {
        workshops.forEach(w => {
            const statusColors = {
                'active': '#22c55e',
                'pending': '#f59e0b',
                'inactive': '#94a3b8'
            };
            const statusLabels = {
                'active': 'Activo',
                'pending': 'Pendiente',
                'inactive': 'Inactivo'
            };

            html += `
                <tr>
                    <td class="font-bold">${w.name}</td>
                    <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${w.type === 'optativa' ? 'Optativa' : 'Taller'}</span></td>
                    <td>${w.level || 'General'}</td>
                    <td>${w.credits || 4}</td>
                    <td>${w.enrolled || 0}/${w.capacity || 30}</td>
                    <td>
                        <span style="color: ${statusColors[w.status] || '#94a3b8'}; font-weight: bold;">
                            ${statusLabels[w.status] || 'Desconocido'}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-toggle-workshop" data-id="${w.id}" title="${w.status === 'active' ? 'Deshabilitar' : 'Habilitar'}" style="background: ${w.status === 'active' ? '#f59e0b' : '#22c55e'}; color: white;">
                                <i class="fa-solid ${w.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-delete-workshop" data-id="${w.id}" data-name="${w.name}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div></div>`;

    mainContainer.innerHTML = html;

    // Event: Nuevo taller
    document.getElementById('btn-new-workshop').addEventListener('click', () => showNewWorkshopModal());

    // Event: Toggle estado
    document.querySelectorAll('.btn-toggle-workshop').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            const result = await DB.toggleWorkshop(id);
            if (result.success) {
                showToast(result.message, 'success');
                renderWorkshops();
            } else {
                showToast(result.error || 'Error', 'error');
                btn.disabled = false;
            }
        });
    });

    // Event: Eliminar
    document.querySelectorAll('.btn-delete-workshop').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            if (!confirm(`¿Eliminar el taller "${name}"?`)) return;
            const result = await DB.deleteWorkshop(id);
            if (result.success) {
                showToast('Taller eliminado', 'success');
                renderWorkshops();
            } else {
                showToast(result.error || 'Error', 'error');
            }
        });
    });
}

function showNewWorkshopModal() {
    const modalHtml = `
        <div id="workshop-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="max-width: 500px; width: 90%;">
                <h3><i class="fa-solid fa-plus"></i> Nuevo Taller/Optativa</h3>
                <form id="workshop-form" style="margin-top: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Nombre</label>
                        <input type="text" id="ws-name" class="input-field" required placeholder="Ej: Taller de Pintura">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Tipo</label>
                        <select id="ws-type" class="input-field">
                            <option value="taller">Taller</option>
                            <option value="optativa">Optativa</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Nivel</label>
                        <select id="ws-level" class="input-field">
                            <option value="Kinder">Kinder</option>
                            <option value="Primaria">Primaria</option>
                            <option value="Secundaria" selected>Secundaria</option>
                            <option value="Universidad">Universidad</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="input-group">
                            <label class="input-label">Créditos</label>
                            <input type="number" id="ws-credits" class="input-field" value="4" min="1" max="10">
                        </div>
                        <div class="input-group">
                            <label class="input-label">Capacidad</label>
                            <input type="number" id="ws-capacity" class="input-field" value="30" min="5" max="100">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" id="cancel-workshop" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('workshop-modal');
    document.getElementById('cancel-workshop').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('workshop-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const result = await DB.createWorkshop({
            name: document.getElementById('ws-name').value,
            type: document.getElementById('ws-type').value,
            level: document.getElementById('ws-level').value,
            credits: parseInt(document.getElementById('ws-credits').value),
            capacity: parseInt(document.getElementById('ws-capacity').value)
        });

        if (result.success) {
            showToast('Taller creado correctamente', 'success');
            modal.remove();
            renderWorkshops();
        } else {
            showToast(result.error || 'Error al crear', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar';
        }
    });
}

// ============================================
// RN-2/RN-3: Preferencias Docentes y Asignación por Antigüedad
// ============================================
async function renderTeacherPreferences() {
    pageTitle.textContent = 'Preferencias Docentes (RN-2/RN-3)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando preferencias...</div>';

    const teachers = await DB.getTeacherPreferences();

    let html = `
        <div class="card">
            <h3><i class="fa-solid fa-user-gear"></i> Preferencias de Docentes y Asignación por Antigüedad</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 4px;">
                    <strong>RN-2: Jerarquía por Antigüedad</strong>
                    <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">La asignación automática prioriza docentes con mayor antigüedad.</p>
                </div>
                <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 1rem; border-radius: 4px;">
                    <strong>RN-3: Penalización</strong>
                    <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Docentes sin preferencias registradas tienen menor prioridad.</p>
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>Especialidad</th>
                            <th>Nivel</th>
                            <th style="text-align: center;">Antigüedad (años)</th>
                            <th style="text-align: center;">¿Tiene Preferencias?</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    teachers.forEach(t => {
        html += `
            <tr>
                <td class="font-bold">${t.teacherName}</td>
                <td class="text-muted">${t.specialty || '-'}</td>
                <td>${t.level || '-'}</td>
                <td style="text-align: center;">
                    <input type="number" class="input-seniority" data-id="${t.teacherId}" value="${t.seniority || 0}" min="0" max="50" style="width: 60px; text-align: center; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </td>
                <td style="text-align: center;">
                    ${t.hasPreferences
                ? '<span style="color: #22c55e;"><i class="fa-solid fa-check-circle"></i> Sí</span>'
                : '<span style="color: #f59e0b;"><i class="fa-solid fa-exclamation-triangle"></i> No (RN-3)</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-prefs" data-id="${t.teacherId}" data-name="${t.teacherName}">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;

    mainContainer.innerHTML = html;

    // Event: Cambio de antigüedad
    document.querySelectorAll('.input-seniority').forEach(input => {
        input.addEventListener('change', async () => {
            const teacherId = input.getAttribute('data-id');
            const seniority = parseInt(input.value) || 0;
            const result = await DB.setSeniority(teacherId, seniority);
            if (result.success) {
                showToast('Antigüedad actualizada', 'success');
            }
        });
    });

    // Event: Editar preferencias
    document.querySelectorAll('.btn-edit-prefs').forEach(btn => {
        btn.addEventListener('click', async () => {
            const teacherId = btn.getAttribute('data-id');
            const teacherName = btn.getAttribute('data-name');

            // Mostrar modal de preferencias
            showTeacherPreferencesModal(teacherId, teacherName);
        });
    });
}

// Modal para editar preferencias de docente
async function showTeacherPreferencesModal(teacherId, teacherName) {
    const subjects = await DB.getSubjects();

    const modalHtml = `
        <div id="prefs-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="max-width: 550px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3><i class="fa-solid fa-gear"></i> Preferencias de ${teacherName}</h3>
                
                <form id="prefs-form" style="margin-top: 1rem;">
                    <div class="input-group">
                        <label class="input-label">Materias Preferidas (seleccione varias)</label>
                        <select id="pref-subjects" class="input-field" multiple size="5" style="height: auto;">
                            ${subjects.map(s => `<option value="${s.id}">${s.name} (${s.level || 'General'})</option>`).join('')}
                        </select>
                        <small class="text-muted">Ctrl+Click para seleccionar múltiples</small>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Horario Preferido</label>
                        <select id="pref-schedule" class="input-field">
                            <option value="">Sin preferencia</option>
                            <option value="matutino">Matutino (7:00 - 14:00)</option>
                            <option value="vespertino">Vespertino (14:00 - 20:00)</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Máximo de Materias Deseadas</label>
                        <input type="number" id="pref-max" class="input-field" value="6" min="1" max="10">
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Notas Adicionales</label>
                        <textarea id="pref-notes" class="input-field" rows="2" placeholder="Observaciones..."></textarea>
                    </div>
                    
                    <div style="background: #e0f2fe; padding: 0.75rem; border-radius: 6px; margin: 1rem 0;">
                        <small><i class="fa-solid fa-info-circle"></i> Al registrar preferencias, el docente tendrá prioridad en la asignación automática (RN-3).</small>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" id="cancel-prefs" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-save"></i> Guardar Preferencias
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('prefs-modal');

    document.getElementById('cancel-prefs').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('prefs-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const selectedSubjects = Array.from(document.getElementById('pref-subjects').selectedOptions).map(opt => opt.value);

        const result = await DB.saveTeacherPreference(teacherId, {
            preferredSubjects: selectedSubjects,
            preferredSchedule: document.getElementById('pref-schedule').value,
            maxSubjects: parseInt(document.getElementById('pref-max').value) || 6,
            notes: document.getElementById('pref-notes').value
        });

        if (result.success) {
            showToast('Preferencias guardadas correctamente', 'success');
            modal.remove();
            renderTeacherPreferences(); // Refrescar tabla
        } else {
            showToast(result.error || 'Error al guardar', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Preferencias';
        }
    });
}

// ============================================
// RN-25: Calendario Académico SEP
// ============================================
async function renderAdminCalendar() {
    pageTitle.textContent = 'Calendario Académico SEP (RN-25)';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando calendario...</div>';

    const calendar = await DB.getCalendar();

    let html = `
        <div class="card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <h3><i class="fa-solid fa-calendar-alt"></i> Calendario Académico ${calendar.schoolYear || ''}</h3>
                <button id="btn-import-sep" class="btn btn-primary">
                    <i class="fa-solid fa-download"></i> Importar Calendario SEP
                </button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- Días Festivos -->
                <div>
                    <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-calendar-xmark"></i> Días Festivos</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
    `;

    const holidays = calendar.holidays || [];
    if (holidays.length === 0) {
        html += `<p class="text-muted">No hay días festivos registrados</p>`;
    } else {
        holidays.forEach(h => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #fef3c7; border-radius: 6px; margin-bottom: 0.5rem;">
                    <div>
                        <strong>${h.name}</strong><br>
                        <small class="text-muted">${h.date}</small>
                    </div>
                    <button class="btn btn-sm btn-danger btn-delete-holiday" data-id="${h.id}">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            `;
        });
    }

    html += `
                    </div>
                    <button id="btn-add-holiday" class="btn btn-secondary w-full" style="margin-top: 1rem;">
                        <i class="fa-solid fa-plus"></i> Agregar Día Festivo
                    </button>
                </div>

                <!-- Períodos -->
                <div>
                    <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-calendar-days"></i> Períodos Académicos</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
    `;

    const periods = calendar.periods || [];
    if (periods.length === 0) {
        html += `<p class="text-muted">No hay períodos registrados</p>`;
    } else {
        periods.forEach(p => {
            html += `
                <div style="padding: 0.5rem; background: #e0f2fe; border-radius: 6px; margin-bottom: 0.5rem;">
                    <strong>${p.name}</strong> (${p.type})<br>
                    <small class="text-muted">${p.startDate} al ${p.endDate}</small>
                </div>
            `;
        });
    }

    html += `
                    </div>
                    <button id="btn-add-period" class="btn btn-secondary w-full" style="margin-top: 1rem;">
                        <i class="fa-solid fa-plus"></i> Agregar Período
                    </button>
                </div>
            </div>
        </div>
    `;

    mainContainer.innerHTML = html;

    // Event: Importar SEP
    document.getElementById('btn-import-sep').addEventListener('click', async () => {
        const year = new Date().getFullYear();
        if (!confirm(`¿Importar calendario SEP para ${year}?`)) return;
        const result = await DB.importSEPCalendar(year);
        if (result.success) {
            showToast(`Importados ${result.imported} días festivos`, 'success');
            renderAdminCalendar();
        } else {
            showToast(result.error || 'Error', 'error');
        }
    });

    // Event: Agregar día festivo
    document.getElementById('btn-add-holiday').addEventListener('click', () => {
        const date = prompt('Fecha del día festivo (YYYY-MM-DD):');
        if (!date) return;
        const name = prompt('Nombre del día festivo:');
        if (!name) return;
        DB.addHoliday(date, name, 'custom').then(result => {
            if (result.success) {
                showToast('Día festivo agregado', 'success');
                renderAdminCalendar();
            }
        });
    });

    // Event: Eliminar festivo
    document.querySelectorAll('.btn-delete-holiday').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const result = await DB.removeHoliday(id);
            if (result.success) {
                showToast('Día festivo eliminado', 'success');
                renderAdminCalendar();
            }
        });
    });
}

// ============================================
// RN-1 (Admin): Mantenimiento del Sistema
// ============================================
async function renderMaintenance() {
    pageTitle.textContent = 'Mantenimiento del Sistema';
    mainContainer.innerHTML = '<div class="card font-bold text-center">Cargando estado del sistema...</div>';

    const [status, logs] = await Promise.all([
        DB.getSystemStatus(),
        DB.getLogs(null, 20)
    ]);

    if (!status) {
        mainContainer.innerHTML = '<div class="card text-error">Error al cargar estado del sistema</div>';
        return;
    }

    let html = `
        <div class="card">
            <h3><i class="fa-solid fa-wrench"></i> Estado del Sistema</h3>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0;">
                <div style="background: #dcfce7; padding: 1rem; border-radius: 8px; text-align: center;">
                    <i class="fa-solid fa-circle" style="color: #22c55e;"></i>
                    <h4 style="margin: 0.5rem 0 0;">${status.status?.toUpperCase() || 'ONLINE'}</h4>
                    <small class="text-muted">Estado</small>
                </div>
                <div style="background: #e0f2fe; padding: 1rem; border-radius: 8px; text-align: center;">
                    <strong style="font-size: 1.5rem;">${status.statistics?.totalUsers || 0}</strong>
                    <div class="text-muted">Usuarios</div>
                </div>
                <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; text-align: center;">
                    <strong style="font-size: 1.5rem;">${status.database?.size || '0 KB'}</strong>
                    <div class="text-muted">Base de Datos</div>
                </div>
                <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; text-align: center;">
                    <strong style="font-size: 1.5rem;">${status.logCount || 0}</strong>
                    <div class="text-muted">Logs</div>
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <button id="btn-backup" class="btn btn-primary">
                    <i class="fa-solid fa-download"></i> Crear Backup
                </button>
                <button id="btn-clear-logs" class="btn btn-warning">
                    <i class="fa-solid fa-trash"></i> Limpiar Logs
                </button>
                <button id="btn-health" class="btn btn-secondary">
                    <i class="fa-solid fa-heartbeat"></i> Health Check
                </button>
            </div>

            <!-- Logs recientes -->
            <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-list"></i> Logs Recientes</h4>
            <div style="max-height: 300px; overflow-y: auto; background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem;">
    `;

    if (logs.length === 0) {
        html += `<p style="opacity: 0.5;">No hay logs registrados</p>`;
    } else {
        logs.forEach(log => {
            const colors = { info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', security: '#a855f7' };
            html += `
                <div style="margin-bottom: 0.5rem; border-left: 3px solid ${colors[log.type] || '#94a3b8'}; padding-left: 0.5rem;">
                    <span style="color: ${colors[log.type] || '#94a3b8'};">[${log.type?.toUpperCase()}]</span>
                    <span style="opacity: 0.6;">${log.timestamp}</span>
                    <br>${log.message}
                </div>
            `;
        });
    }

    html += `</div></div>`;

    mainContainer.innerHTML = html;

    // Event: Backup
    document.getElementById('btn-backup').addEventListener('click', async () => {
        const btn = document.getElementById('btn-backup');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        const result = await DB.createBackup();
        if (result.success) {
            showToast('Backup creado correctamente', 'success');
        } else {
            showToast(result.error || 'Error', 'error');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-download"></i> Crear Backup';
    });

    // Event: Limpiar logs
    document.getElementById('btn-clear-logs').addEventListener('click', async () => {
        if (!confirm('¿Limpiar todos los logs del sistema?')) return;
        const result = await DB.clearLogs();
        if (result.success) {
            showToast('Logs limpiados', 'success');
            renderMaintenance();
        }
    });

    // Event: Health check
    document.getElementById('btn-health').addEventListener('click', async () => {
        const health = await DB.healthCheck();
        if (health.healthy) {
            showToast('Sistema saludable ✓', 'success');
        } else {
            showToast('Se detectaron problemas en el sistema', 'warning');
        }
    });
}


