const themes = {
    'Kinder': {
        primary: '#FF6B6B', // Rojo
        secondary: '#4ECDC4', // Turquesa
        bgSoftPrimary: '#FFF0F0',
        bgSoftSecondary: '#E0F7FA'
    },
    'Primaria': {
        primary: '#72d25aff', // Verde
        secondary: '#F1C40F', // Amarillo
        bgSoftPrimary: '#EAFAF1',
        bgSoftSecondary: '#FEF9E7'
    },
    'Secundaria': {
        primary: '#c27516ff', // Púrpura
        secondary: '#FCC43E', // Naranja/Amarillo
        bgSoftPrimary: '#F3F6FF',
        bgSoftSecondary: '#FFF9E6'
    },
    'Universidad': {
        primary: '#2C3E50', // Azul Oscuro
        secondary: '#E74C3C', // Carmesí
        bgSoftPrimary: '#F4F6F7',
        bgSoftSecondary: '#FDEDEC'
    }
};



document.addEventListener('DOMContentLoaded', function () {

    // Toggle de visibilidad de contraseña
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('password-icon');

    if (togglePasswordBtn && passwordInput && passwordIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordIcon.classList.toggle('fa-eye', !isPassword);
            passwordIcon.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    // Inicializar con la funcionalidad por defecto
    initCalendar();

    // Toggle Sidebar
    /* Sidebar hover logic is CSS-only now, but keeping clean JS state */

    // Dark Mode Toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggleBtn.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.replace('bi-moon-stars', 'bi-sun');
            } else {
                icon.classList.replace('bi-sun', 'bi-moon-stars');
            }
        });
    }
});

// --- Función para establecer el Nivel ---
function setLevel(levelName) {
    const levelDisplay = document.getElementById('currentLevel');
    if (levelDisplay) {
        levelDisplay.innerText = levelName;
    }

    // Actualizar Tema
    applyTheme(levelName);
}

function applyTheme(levelName) {
    const theme = themes[levelName];
    if (!theme) return;

    // Actualizar Variables CSS
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--bg-soft-primary', theme.bgSoftPrimary);
    root.style.setProperty('--bg-soft-secondary', theme.bgSoftSecondary);

    const primaryRgb = hexToRgb(theme.primary);

    // Actualizar Gráficos

}

function hexToRgb(hex) {
    // Eliminar la almohadilla
    hex = hex.replace(/^#/, '');
    // Parsear
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

// --- Lógica del Calendario ---
let currentDate = new Date(); // Fecha actual para el calendario

function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => changeMonth(-1));
        nextBtn.addEventListener('click', () => changeMonth(1));
    }

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

    // Nombres de meses en español
    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    monthYearLabel.innerText = `${monthNames[month]} ${year}`;

    // Primer día del mes
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    // Total de días en el mes
    const lastDay = new Date(year, month + 1, 0).getDate();

    // HTML Header Días
    let html = `
        <div class="calendar-week-grid mb-2 text-muted small fw-bold">
            <div>Dom</div><div>Lun</div><div>Mar</div>
            <div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
        </div>
        <div class="calendar-week-grid">
    `;

    // Espacios en blanco antes del primer día
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div></div>`;
    }

    // Días del mes
    const today = new Date();
    for (let i = 1; i <= lastDay; i++) {
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const activeClass = isToday ? 'bg-primary text-white rounded-circle shadow-sm' : '';
        // Ajuste visual
        const style = isToday ? 'width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; margin: 0 auto;' : 'padding: 0.5rem;';

        html += `
            <div>
                <div class="${activeClass}" style="${style} cursor: pointer;">${i}</div>
            </div>
        `;
    }

    html += `</div>`;
    calendarGrid.innerHTML = html;
}

