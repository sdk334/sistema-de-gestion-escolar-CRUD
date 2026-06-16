// Módulo de Autenticación
// Maneja sesiones de usuario, login, logout y validación de contraseñas

const CLAVE_SESION = 'schoolhub_session';
const TIEMPO_EXPIRACION_MS = 5 * 60 * 1000; // 5 minutos (RN-28: 3-5 mins requeridos)
const TIEMPO_ADVERTENCIA_MS = 30 * 1000; // 30 segundos antes de expirar

const Autenticacion = {
    // Estado del usuario actual
    usuarioActual: null,
    temporizadorId: null,
    temporizadorAdvertenciaId: null,
    modalAdvertenciaVisible: false,

    // Inicializar: Verificar si existe sesión previa
    iniciar() {
        const sesionGuardada = localStorage.getItem(CLAVE_SESION);
        if (sesionGuardada) {
            const { user, timestamp } = JSON.parse(sesionGuardada);
            // RNF-4: Verificar si la sesión ha expirado
            if (Date.now() - timestamp < TIEMPO_EXPIRACION_MS) {
                this.usuarioActual = user;
                this.iniciarTemporizadorSesion();
                return user;
            } else {
                this.cerrarSesion('Su sesión ha expirado por inactividad (RNF-4)');
            }
        }
        return null;
    },

    // Iniciar sesión (CU-001)
    async iniciarSesion(identificador, contrasena) {
        const resultado = await DB.authenticate(identificador, contrasena);
        if (resultado.success) {
            this.usuarioActual = resultado.user;
            this.guardarSesion();
            this.iniciarTemporizadorSesion();
            return { success: true, user: resultado.user };
        }
        return resultado;
    },

    // Cerrar sesión (CU-002)
    cerrarSesion(motivo = null) {
        this.usuarioActual = null;
        if (this.temporizadorId) clearTimeout(this.temporizadorId);
        localStorage.removeItem(CLAVE_SESION);

        // Disparar evento para la interfaz de usuario
        const evento = new CustomEvent('auth:logout', { detail: { reason: motivo } });
        window.dispatchEvent(evento);
    },

    // Gestión de Sesión: Guardar sesión actual
    guardarSesion() {
        if (!this.usuarioActual) return;
        const datosSesion = {
            user: this.usuarioActual,
            timestamp: Date.now()
        };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(datosSesion));
    },

    // Iniciar temporizador de sesión
    iniciarTemporizadorSesion() {
        if (this.temporizadorId) clearTimeout(this.temporizadorId);
        if (this.temporizadorAdvertenciaId) clearTimeout(this.temporizadorAdvertenciaId);
        this.ocultarAdvertenciaSesion();

        // RN-28: Mostrar advertencia 30 segundos antes de expirar
        this.temporizadorAdvertenciaId = setTimeout(() => {
            this.mostrarAdvertenciaSesion();
        }, TIEMPO_EXPIRACION_MS - TIEMPO_ADVERTENCIA_MS);

        // RN-28: Tiempo fijo de 5 min desde la última interacción
        this.temporizadorId = setTimeout(() => {
            this.ocultarAdvertenciaSesion();
            this.cerrarSesion('Su sesión ha expirado por inactividad (5 min)');
        }, TIEMPO_EXPIRACION_MS);
    },

    // Mostrar advertencia de sesión próxima a expirar (RN-28)
    mostrarAdvertenciaSesion() {
        if (this.modalAdvertenciaVisible) return;
        this.modalAdvertenciaVisible = true;

        // Crear modal de advertencia
        const modal = document.createElement('div');
        modal.id = 'modal-advertencia-sesion';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
                <h3 style="color: var(--color-warning, #f0ad4e); margin-bottom: 1rem;">Sesión por expirar</h3>
                <p>Su sesión se cerrará en <strong id="contador-sesion">30</strong> segundos por inactividad.</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">¿Desea continuar trabajando?</p>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                    <button id="btn-continuar-sesion" class="btn btn-primary" style="min-width: 140px;">
                        <i class="fas fa-check"></i> Continuar
                    </button>
                    <button id="btn-cerrar-sesion" class="btn btn-secondary" style="min-width: 140px;">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Contador regresivo
        let segundosRestantes = 30;
        const contadorEl = document.getElementById('contador-sesion');
        const intervaloContador = setInterval(() => {
            segundosRestantes--;
            if (contadorEl) contadorEl.textContent = segundosRestantes;
            if (segundosRestantes <= 0) clearInterval(intervaloContador);
        }, 1000);

        // Eventos de botones
        document.getElementById('btn-continuar-sesion').addEventListener('click', () => {
            clearInterval(intervaloContador);
            this.reiniciarTemporizador();
        });

        document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
            clearInterval(intervaloContador);
            this.ocultarAdvertenciaSesion();
            this.cerrarSesion('Sesión cerrada por el usuario');
        });
    },

    // Ocultar advertencia de sesión
    ocultarAdvertenciaSesion() {
        this.modalAdvertenciaVisible = false;
        const modal = document.getElementById('modal-advertencia-sesion');
        if (modal) modal.remove();
    },

    // Reiniciar temporizador al detectar actividad
    reiniciarTemporizador() {
        if (!this.usuarioActual) return;
        this.guardarSesion(); // Actualizar timestamp con actividad
        this.iniciarTemporizadorSesion();
    },

    // RN-8: Validador de Complejidad de Contraseña
    validarContrasena(contrasena) {
        // Mínimo 9 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;
        if (!regex.test(contrasena)) {
            return { valid: false, error: 'La contraseña debe tener al menos 9 caracteres, mayúscula, minúscula, número y símbolo.' };
        }

        // Verificar símbolos especiales consecutivos (RN-8)
        if (/([!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])\1/.test(contrasena)) {
            return { valid: false, error: 'La contraseña no puede tener símbolos especiales consecutivos.' };
        }

        return { valid: true };
    }
};

// Alias para compatibilidad con código existente
const Auth = {
    get currentUser() { return Autenticacion.usuarioActual; },
    init: () => Autenticacion.iniciar(),
    login: (id, pw) => Autenticacion.iniciarSesion(id, pw),
    logout: (r) => Autenticacion.cerrarSesion(r),
    resetTimer: () => Autenticacion.reiniciarTemporizador(),
    validatePassword: (p) => Autenticacion.validarContrasena(p)
};

// Escuchador global de actividad para expiración deslizante (RNF-4)
// Solo reiniciamos si el usuario está autenticado
['click', 'mousemove', 'keypress'].forEach(evento => {
    window.addEventListener(evento, () => {
        if (Autenticacion.usuarioActual) Autenticacion.reiniciarTemporizador();
    });
});
