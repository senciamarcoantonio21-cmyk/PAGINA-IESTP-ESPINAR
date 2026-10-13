const STORAGE_KEY = "sia-espinar-demo-v1";
const SESSION_KEY = "sia-espinar-session-v1";
const app = document.querySelector("#app");

const createInitialData = () => ({
  currentPeriod: "2026-II",
  users: [
    { id: "admin-demo", dni: "00000000", name: "Administrador Demo", email: "admin@iestpespinar.edu.pe", password: "Admin123!", role: "admin", career: "Administración del sistema" },
    { id: "student-demo", dni: "00000001", name: "Estudiante Demo", email: "estudiante@iestpespinar.edu.pe", password: "00000001", role: "student", career: "Arquitectura de Plataformas y Servicios de Tecnologías de Información" }
  ],
  courses: [
    { id: "course-demo", name: "Desarrollo de aplicaciones", semester: "IV", credits: 4, period: "2026-II" }
  ],
  grades: [
    { id: "grade-demo", userId: "student-demo", courseId: "course-demo", period: "2026-II", grade: 14, attendance: "—" }
  ]
});

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initial = createInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.courses) || !Array.isArray(parsed.grades)) {
      throw new Error("La estructura guardada no es válida.");
    }
    return parsed;
  } catch (error) {
    console.error("No se pudieron leer los datos locales del SIA.", error);
    app.innerHTML = `<main class="login-shell"><section class="login-card"><h1>No se pudieron cargar los datos</h1><p class="section-note">El almacenamiento local está dañado o no tiene el formato esperado. No se sobrescribió para evitar perder información.</p><button class="button button-primary" data-action="reset-storage">Restablecer demo</button></section></main>`;
    return null;
  }
}

let data = loadData();
let currentUser = null;
let page = "dashboard";
let editingStudentId = null;
let editingCourseId = null;
let editingGradeId = null;
let flashMessage = "";

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function initials(name) {
  return String(name || "").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "U";
}

function findUser(id) { return data.users.find(user => user.id === id); }
function findCourse(id) { return data.courses.find(course => course.id === id); }
function studentGrades(userId, period) {
  return data.grades.filter(grade => grade.userId === userId && (!period || grade.period === period));
}
function average(grades) {
  const credits = grades.reduce((total, grade) => total + Number(findCourse(grade.courseId)?.credits || 0), 0);
  return credits
    ? (grades.reduce((total, grade) => total + Number(grade.grade) * Number(findCourse(grade.courseId)?.credits || 0), 0) / credits).toFixed(2)
    : "—";
}
function gradeStatus(value) {
  return Number(value) >= 13
    ? '<span class="status status-approved">APROBADO</span>'
    : '<span class="status status-failed">DESAPROBADO</span>';
}
function showFlash(message) {
  flashMessage = message;
}
function renderFlash() {
  if (!flashMessage) return "";
  const message = escapeHtml(flashMessage);
  flashMessage = "";
  return `<div class="notice notice-success">${message}</div>`;
}

function passwordVisibilityButton(inputId) {
  return `<button class="password-visibility" type="button" data-action="toggle-password" data-target="${inputId}" aria-label="Mostrar contraseña" aria-pressed="false" title="Mostrar contraseña">
    <svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  </button>`;
}

function renderLogin() {
  if (!data) return;
  app.innerHTML = `
    <main class="login-shell">
      <div class="login-layout">
        <section class="login-intro" aria-label="Información institucional">
          <div class="login-institution">
            <img src="logo-iestp%20(1).png" alt="Escudo del IESTP Espinar">
            <div><strong>Instituto de Educación Superior Tecnológico Público - "Espinar"</strong></div>
          </div>
          <div class="login-intro-copy">
            <span class="login-eyebrow">PORTAL INSTITUCIONAL</span>
            <h1>Sistema de<br>Información Académica</h1>
            <p>Consulta tu información académica desde un espacio diseñado para acompañar tu formación.</p>
          </div>
          <div class="login-security"><span class="security-icon" aria-hidden="true">✓</span><span>Acceso para estudiantes y personal autorizado</span></div>
          <span class="login-decoration login-decoration-one" aria-hidden="true"></span>
          <span class="login-decoration login-decoration-two" aria-hidden="true"></span>
        </section>
        <section class="login-card">
          <div class="login-form-heading">
            <span class="login-form-icon" aria-hidden="true">↗</span>
            <span class="login-eyebrow">SIA</span>
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales institucionales para continuar.</p>
          </div>
          ${flashMessage ? `<div class="notice notice-success">${escapeHtml(flashMessage)}</div>` : ""}
          <div id="login-error" class="notice notice-error hidden" role="alert"></div>
          <form id="login-form" novalidate>
            <div class="field"><label for="login-dni">DNI o usuario</label><input id="login-dni" name="dni" inputmode="numeric" autocomplete="username" placeholder="Escribe tu DNI o usuario" required maxlength="30"></div>
            <div class="field"><label for="login-password">Contraseña</label><div class="password-input"><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Escribe tu contraseña" required minlength="6" maxlength="100">${passwordVisibilityButton("login-password")}</div></div>
            <button class="button button-primary button-block" type="submit">Ingresar al sistema <span aria-hidden="true">→</span></button>
          </form>
          <p class="login-help">¿No tienes acceso? Comunícate con el área de administración.</p>
          <div class="login-form-footer"><span aria-hidden="true">●</span> Instituto de Educación Superior Tecnológico Público - "Espinar"</div>
        </section>
      </div>
    </main>`;
  flashMessage = "";
}

const studentNavigation = [
  { section: "Mi espacio", items: [["courses", "▣", "Mis cursos"], ["grades", "▤", "Mis notas"]] },
  { section: "Sesión", items: [["logout", "⇥", "Cerrar sesión"]] }
];
const adminNavigation = [
  { section: "Resumen", items: [["dashboard", "⌂", "Panel principal"]] },
  { section: "Gestión académica", items: [["students", "♙", "Estudiantes"], ["courses", "▣", "Cursos"], ["admin-grades", "▤", "Notas"]] },
  { section: "Administración", items: [["settings", "⚙", "Periodo académico"], ["logout", "⇥", "Cerrar sesión"]] }
];

function renderNavigation() {
  const groups = currentUser.role === "admin" ? adminNavigation : studentNavigation;
  return groups.map(group => `
    <div class="nav-section">${group.section}</div>
    <div class="nav-list">${group.items.map(([id, icon, label]) => `
      <button class="nav-link ${page === id ? "active" : ""}" data-page="${id}">
        <span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span>
      </button>`).join("")}</div>`).join("");
}

function shell(title, content) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand brand-lockup">
          <img src="logo-iestp%20(1).png" alt="">
          <div><strong>IESTP ESPINAR</strong><span>Sistema de Información Académica</span></div>
        </div>
        ${renderNavigation()}
        <div class="sidebar-note">Sistema en modo demostración. La información se guarda únicamente en este navegador.</div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:11px"><button class="mobile-menu" data-action="toggle-menu" aria-label="Abrir menú">☰</button><h1>${escapeHtml(title)}</h1></div>
          <div class="topbar-actions">
            <span class="period-badge">Periodo vigente: ${escapeHtml(data.currentPeriod)}</span>
            <div class="user-menu"><span class="avatar">${escapeHtml(initials(currentUser.name))}</span><div class="user-copy"><strong>${escapeHtml(currentUser.name)}</strong><span>${currentUser.role === "admin" ? "Administrador" : "Estudiante"}</span></div></div>
          </div>
        </header>
        <main class="content">${renderFlash()}${content}</main>
        <footer class="footer">SIA · Instituto de Educación Superior Tecnológico Público “Espinar” · Demo local v1.0</footer>
      </section>
    </div>`;
}

function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div>${action}</div>`;
}

function statCard(icon, value, label, color = "") {
  return `<article class="stat-card"><span class="stat-icon ${color}">${icon}</span><div><span class="stat-value">${escapeHtml(value)}</span><span class="stat-label">${escapeHtml(label)}</span></div></article>`;
}

function gradeRows(grades, includeStudent = false) {
  if (!grades.length) return `<tr><td class="empty-state" colspan="${includeStudent ? 7 : 6}">No hay notas registradas para este periodo.</td></tr>`;
  return grades.map(grade => {
    const course = findCourse(grade.courseId);
    const student = findUser(grade.userId);
    return `<tr>
      ${includeStudent ? `<td>${escapeHtml(student?.name || "Estudiante eliminado")}</td>` : ""}
      <td>${escapeHtml(course?.name || "Curso eliminado")}</td>
      <td class="text-center">${escapeHtml(course?.semester || "—")}</td>
      <td class="text-center">${escapeHtml(course?.credits ?? "—")}</td>
      <td class="text-center ${Number(grade.grade) < 13 ? "text-danger" : ""}">${Number(grade.grade).toFixed(2)}</td>
      ${includeStudent ? `<td>${escapeHtml(grade.period)}</td>` : `<td class="text-center">${escapeHtml(grade.attendance || "—")}</td>`}
      <td>${gradeStatus(grade.grade)}</td>
    </tr>`;
  }).join("");
}

function renderStudentCourses() {
  const grades = studentGrades(currentUser.id, null).sort((first, second) => second.period.localeCompare(first.period));
  return shell("Mis cursos", `
    ${heading("Mis cursos", `Cursos asociados a tu cuenta · periodo vigente ${data.currentPeriod}`)}
    <section class="panel">
      <div class="panel-heading"><h3>Mis unidades didácticas</h3><span class="muted">${grades.length} registros</span></div>
      <div class="table-wrap"><table><thead><tr><th>Unidad didáctica</th><th>Periodo académico</th><th class="text-center">Créditos</th><th>Periodo lectivo</th><th>Nota final</th><th>Estado</th></tr></thead><tbody>
        ${grades.length ? grades.map(grade => {
          const course = findCourse(grade.courseId);
          return `<tr><td>${escapeHtml(course?.name || "Curso eliminado")}</td><td>${escapeHtml(course?.semester || "—")}</td><td class="text-center">${escapeHtml(course?.credits ?? "—")}</td><td>${escapeHtml(grade.period)}</td><td class="text-center ${Number(grade.grade) < 13 ? "text-danger" : ""}">${Number(grade.grade).toFixed(2)}</td><td>${gradeStatus(grade.grade)}</td></tr>`;
        }).join("") : `<tr><td class="empty-state" colspan="6">Todavía no tienes cursos asignados.</td></tr>`}
      </tbody></table></div>
    </section>`);
}

function renderStudentGrades() {
  const grades = studentGrades(currentUser.id, null).sort((first, second) => second.period.localeCompare(first.period));
  return shell("Mis notas", `
    ${heading("Mis notas", "Consulta únicamente tus calificaciones y resultados académicos.")}
    <section class="stats-grid">
      ${statCard("⌁", average(grades), "Promedio ponderado")}
      ${statCard("✓", String(grades.filter(grade => Number(grade.grade) >= 13).length), "Cursos aprobados", "green")}
      ${statCard("▤", String(grades.length), "Unidades didácticas", "cyan")}
    </section>
    <section class="panel">
      <div class="panel-heading"><h3>Historial de calificaciones</h3><strong class="muted">Periodo vigente: ${escapeHtml(data.currentPeriod)}</strong></div>
      <div class="table-wrap"><table><thead><tr><th>Unidad didáctica</th><th class="text-center">Periodo académico</th><th class="text-center">Créditos</th><th>Periodo lectivo</th><th class="text-center">Nota final</th><th class="text-center">Asistencia</th><th>Estado</th></tr></thead><tbody>
      ${grades.length ? grades.map(grade => {
        const course = findCourse(grade.courseId);
        return `<tr><td>${escapeHtml(course?.name || "Curso eliminado")}</td><td class="text-center">${escapeHtml(course?.semester || "—")}</td><td class="text-center">${escapeHtml(course?.credits ?? "—")}</td><td>${escapeHtml(grade.period)}</td><td class="text-center ${Number(grade.grade) < 13 ? "text-danger" : ""}">${Number(grade.grade).toFixed(2)}</td><td class="text-center">${escapeHtml(grade.attendance || "—")}</td><td>${gradeStatus(grade.grade)}</td></tr>`;
      }).join("") : `<tr><td class="empty-state" colspan="7">No hay notas registradas para tu cuenta.</td></tr>`}
      </tbody></table></div>
    </section>
    `);
}

function renderAdminDashboard() {
  const students = data.users.filter(user => user.role === "student");
  const grades = data.grades.filter(grade => grade.period === data.currentPeriod);
  const averages = grades.map(grade => Number(grade.grade));
  const averageAll = averages.length ? (averages.reduce((sum, value) => sum + value, 0) / averages.length).toFixed(2) : "—";
  return shell("Panel principal", `
    ${heading("Panel de administración", `Resumen académico · periodo ${data.currentPeriod}`)}
    <section class="stats-grid">
      ${statCard("♙", String(students.length), "Estudiantes registrados")}
      ${statCard("▣", String(data.courses.length), "Cursos disponibles", "green")}
      ${statCard("▤", String(grades.length), "Notas en el periodo", "cyan")}
      ${statCard("⌁", averageAll, "Promedio general", "gold")}
    </section>
    <section class="panel"><div class="panel-heading"><h3>Actividad reciente del periodo</h3><button class="text-button" data-page="admin-grades">Gestionar notas →</button></div>
      <div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Unidad didáctica</th><th>Periodo académico</th><th>Nota</th><th>Estado</th></tr></thead><tbody>
      ${grades.length ? grades.slice(-8).reverse().map(grade => {
        const student = findUser(grade.userId);
        const course = findCourse(grade.courseId);
        return `<tr><td>${escapeHtml(student?.name || "Estudiante eliminado")}</td><td>${escapeHtml(course?.name || "Curso eliminado")}</td><td>${escapeHtml(grade.period)}</td><td>${Number(grade.grade).toFixed(2)}</td><td>${gradeStatus(grade.grade)}</td></tr>`;
      }).join("") : `<tr><td class="empty-state" colspan="5">Todavía no se registraron notas para este periodo.</td></tr>`}
      </tbody></table></div>
    </section>`);
}

function studentForm() {
  const student = editingStudentId ? findUser(editingStudentId) : null;
  return `<section class="panel"><div class="panel-heading"><h3>${student ? "Editar estudiante" : "Registrar estudiante"}</h3></div><div class="panel-body">
    <form id="student-form" data-id="${student ? escapeHtml(student.id) : ""}">
      <div class="form-grid">
        <div class="field"><label for="student-name">Nombres y apellidos</label><input id="student-name" name="name" required maxlength="90" value="${escapeHtml(student?.name || "")}"></div>
        <div class="field"><label for="student-dni">DNI</label><input id="student-dni" name="dni" inputmode="numeric" required pattern="[0-9]{8}" maxlength="8" value="${escapeHtml(student?.dni || "")}"></div>
        <div class="field"><label for="student-email">Correo</label><input id="student-email" name="email" type="email" required maxlength="120" value="${escapeHtml(student?.email || "")}"></div>
        <div class="field"><label for="student-career">Programa de estudios</label><input id="student-career" name="career" required maxlength="120" value="${escapeHtml(student?.career || "")}"></div>
        ${student ? "" : `<div class="field"><label for="student-password">Contraseña inicial</label><div class="password-input"><input id="student-password" name="password" type="password" required minlength="6" maxlength="100">${passwordVisibilityButton("student-password")}</div><small>El estudiante podrá cambiarla desde su cuenta.</small></div>`}
      </div>
      <div class="form-actions"><button class="button button-primary" type="submit">${student ? "Guardar cambios" : "Registrar estudiante"}</button>${student ? `<button class="button button-secondary" type="button" data-action="cancel-student-edit">Cancelar</button>` : ""}</div>
    </form>
  </div></section>`;
}

function renderStudents() {
  const students = data.users.filter(user => user.role === "student");
  return shell("Estudiantes", `
    ${heading("Estudiantes", "Registra y administra las cuentas de estudiantes.")}
    ${studentForm()}
    <section class="panel"><div class="panel-heading"><h3>Directorio de estudiantes</h3><span class="muted">${students.length} registros</span></div>
      <div class="table-wrap"><table><thead><tr><th>DNI</th><th>Nombre</th><th>Correo</th><th>Programa de estudios</th><th>Acciones</th></tr></thead><tbody>
      ${students.length ? students.map(student => `<tr><td>${escapeHtml(student.dni)}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.email)}</td><td>${escapeHtml(student.career)}</td><td><div class="actions"><button class="button button-secondary button-small" data-action="edit-student" data-id="${escapeHtml(student.id)}">Editar</button><button class="button button-danger button-small" data-action="delete-student" data-id="${escapeHtml(student.id)}">Eliminar</button></div></td></tr>`).join("") : `<tr><td class="empty-state" colspan="5">Aún no hay estudiantes registrados.</td></tr>`}
      </tbody></table></div>
    </section>`);
}

function courseForm() {
  const course = editingCourseId ? findCourse(editingCourseId) : null;
  return `<section class="panel"><div class="panel-heading"><h3>${course ? "Editar curso" : "Agregar curso"}</h3></div><div class="panel-body">
    <form id="course-form" data-id="${course ? escapeHtml(course.id) : ""}">
      <div class="form-grid">
        <div class="field"><label for="course-name">Nombre de unidad didáctica</label><input id="course-name" name="name" required maxlength="100" value="${escapeHtml(course?.name || "")}"></div>
        <div class="field"><label for="course-semester">Periodo académico / ciclo</label><input id="course-semester" name="semester" required maxlength="20" placeholder="Ej. IV" value="${escapeHtml(course?.semester || "")}"></div>
        <div class="field"><label for="course-credits">Créditos</label><input id="course-credits" name="credits" type="number" min="1" max="30" required value="${escapeHtml(course?.credits || 4)}"></div>
        <div class="field"><label for="course-period">Periodo lectivo</label><input id="course-period" name="period" required pattern="[0-9]{4}-(I|II)" value="${escapeHtml(course?.period || data.currentPeriod)}"><small>Formato esperado: 2026-I o 2026-II.</small></div>
      </div>
      <div class="form-actions"><button class="button button-primary" type="submit">${course ? "Guardar cambios" : "Agregar curso"}</button>${course ? `<button class="button button-secondary" type="button" data-action="cancel-course-edit">Cancelar</button>` : ""}</div>
    </form>
  </div></section>`;
}

function renderCourses() {
  return shell("Cursos", `
    ${heading("Cursos", "Administra las unidades didácticas que estarán disponibles para el registro de notas.")}
    ${courseForm()}
    <section class="panel"><div class="panel-heading"><h3>Unidades didácticas</h3><span class="muted">${data.courses.length} registros</span></div>
      <div class="table-wrap"><table><thead><tr><th>Unidad didáctica</th><th>Ciclo</th><th>Créditos</th><th>Periodo lectivo</th><th>Acciones</th></tr></thead><tbody>
      ${data.courses.length ? data.courses.map(course => `<tr><td>${escapeHtml(course.name)}</td><td>${escapeHtml(course.semester)}</td><td>${escapeHtml(course.credits)}</td><td>${escapeHtml(course.period)}</td><td><div class="actions"><button class="button button-secondary button-small" data-action="edit-course" data-id="${escapeHtml(course.id)}">Editar</button><button class="button button-danger button-small" data-action="delete-course" data-id="${escapeHtml(course.id)}">Eliminar</button></div></td></tr>`).join("") : `<tr><td class="empty-state" colspan="5">Aún no hay cursos registrados.</td></tr>`}
      </tbody></table></div>
    </section>`);
}

function gradeForm() {
  const grade = editingGradeId ? data.grades.find(item => item.id === editingGradeId) : null;
  const students = data.users.filter(user => user.role === "student");
  return `<section class="panel"><div class="panel-heading"><h3>${grade ? "Editar nota" : "Registrar nota"}</h3></div><div class="panel-body">
    ${!students.length || !data.courses.length ? `<p class="section-note">Primero registra al menos un estudiante y un curso para poder ingresar notas.</p>` : ""}
    <form id="grade-form" data-id="${grade ? escapeHtml(grade.id) : ""}">
      <div class="form-grid">
        <div class="field"><label for="grade-student">Estudiante</label><select id="grade-student" name="userId" required><option value="">Selecciona un estudiante</option>${students.map(student => `<option value="${escapeHtml(student.id)}" ${student.id === grade?.userId ? "selected" : ""}>${escapeHtml(student.name)} · ${escapeHtml(student.dni)}</option>`).join("")}</select></div>
        <div class="field"><label for="grade-course">Unidad didáctica</label><select id="grade-course" name="courseId" required><option value="">Selecciona un curso</option>${data.courses.map(course => `<option value="${escapeHtml(course.id)}" ${course.id === grade?.courseId ? "selected" : ""}>${escapeHtml(course.name)} · ${escapeHtml(course.period)}</option>`).join("")}</select></div>
        <div class="field"><label for="grade-period">Periodo lectivo</label><input id="grade-period" name="period" required pattern="[0-9]{4}-(I|II)" value="${escapeHtml(grade?.period || data.currentPeriod)}"></div>
        <div class="field"><label for="grade-value">Nota final (0–20)</label><input id="grade-value" name="grade" type="number" min="0" max="20" step="0.01" required value="${escapeHtml(grade?.grade ?? "")}"></div>
        <div class="field"><label for="grade-attendance">Asistencia (opcional)</label><input id="grade-attendance" name="attendance" maxlength="30" placeholder="Ej. 95%" value="${escapeHtml(grade?.attendance === "—" ? "" : grade?.attendance || "")}"></div>
      </div>
      <div class="form-actions"><button class="button button-primary" type="submit" ${!students.length || !data.courses.length ? "disabled" : ""}>${grade ? "Guardar nota" : "Registrar nota"}</button>${grade ? `<button class="button button-secondary" type="button" data-action="cancel-grade-edit">Cancelar</button>` : ""}</div>
    </form>
  </div></section>`;
}

function renderAdminGrades() {
  const grades = data.grades.slice().sort((first, second) => second.period.localeCompare(first.period));
  return shell("Gestión de notas", `
    ${heading("Gestión de notas", "Ingresa, corrige y consulta las calificaciones de los estudiantes.")}
    ${gradeForm()}
    <section class="panel"><div class="panel-heading"><h3>Notas registradas</h3><span class="muted">${grades.length} registros</span></div>
      <div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Unidad didáctica</th><th>Ciclo</th><th>Nota</th><th>Periodo lectivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      ${grades.length ? grades.map(grade => {
        const student = findUser(grade.userId);
        const course = findCourse(grade.courseId);
        return `<tr><td>${escapeHtml(student?.name || "Estudiante eliminado")}</td><td>${escapeHtml(course?.name || "Curso eliminado")}</td><td>${escapeHtml(course?.semester || "—")}</td><td class="${Number(grade.grade) < 13 ? "text-danger" : ""}">${Number(grade.grade).toFixed(2)}</td><td>${escapeHtml(grade.period)}</td><td>${gradeStatus(grade.grade)}</td><td><div class="actions"><button class="button button-secondary button-small" data-action="edit-grade" data-id="${escapeHtml(grade.id)}">Editar</button><button class="button button-danger button-small" data-action="delete-grade" data-id="${escapeHtml(grade.id)}">Eliminar</button></div></td></tr>`;
      }).join("") : `<tr><td class="empty-state" colspan="7">Aún no hay notas registradas.</td></tr>`}
      </tbody></table></div>
    </section>`);
}

function renderSettings() {
  return shell("Periodo académico", `
    ${heading("Configuración académica", "Establece el periodo lectivo que se mostrará como vigente en el sistema.")}
    <section class="panel" style="max-width:600px"><div class="panel-heading"><h3>Periodo vigente</h3></div><div class="panel-body">
      <p class="section-note">El cambio de periodo no modifica ni elimina las notas existentes. El formato debe ser año y semestre, por ejemplo: 2026-II.</p>
      <form id="period-form"><div class="field"><label for="current-period">Periodo lectivo vigente</label><input id="current-period" name="period" required pattern="[0-9]{4}-(I|II)" value="${escapeHtml(data.currentPeriod)}"></div>
      <button class="button button-primary" type="submit">Guardar periodo</button></form>
    </div></section>`);
}

function renderApp() {
  if (!data) return;
  if (!currentUser) {
    renderLogin();
    return;
  }
  if (currentUser.role === "admin") {
    const pages = {
      dashboard: renderAdminDashboard,
      students: renderStudents,
      courses: renderCourses,
      "admin-grades": renderAdminGrades,
      settings: renderSettings
    };
    (pages[page] || renderAdminDashboard)();
    return;
  }
  const pages = {
    courses: renderStudentCourses,
    grades: renderStudentGrades
  };
  (pages[page] || renderStudentCourses)();
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showFormError(message) {
  const error = document.querySelector("#login-error");
  if (error) {
    error.textContent = message;
    error.classList.remove("hidden");
  } else {
    showFlash(message);
    renderApp();
  }
}

app.addEventListener("click", event => {
  const target = event.target.closest("[data-action], [data-page]");
  if (!target) return;
  if (target.dataset.page) {
    if (target.dataset.page === "logout") {
      currentUser = null;
      localStorage.removeItem(SESSION_KEY);
      page = "dashboard";
      renderApp();
      return;
    }
    const allowedPages = currentUser.role === "admin"
      ? ["dashboard", "students", "courses", "admin-grades", "settings"]
      : ["courses", "grades"];
    if (!allowedPages.includes(target.dataset.page)) return;
    page = target.dataset.page;
    const sidebar = document.querySelector("#sidebar");
    if (sidebar) sidebar.classList.remove("open");
    renderApp();
    return;
  }
  const { action, id } = target.dataset;
  if (action === "toggle-password") {
    const input = document.getElementById(target.dataset.target);
    if (!(input instanceof HTMLInputElement)) return;
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    target.setAttribute("aria-label", showPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    target.setAttribute("title", showPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    target.setAttribute("aria-pressed", String(showPassword));
    target.innerHTML = showPassword
      ? `<svg class="icon-eye icon-eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7c1.4 0 2.7-.4 3.8-1"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path></svg>`
      : `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    return;
  }
  if (action === "toggle-menu") { document.querySelector("#sidebar")?.classList.toggle("open"); return; }
  if (action === "logout") { currentUser = null; localStorage.removeItem(SESSION_KEY); page = "dashboard"; renderApp(); return; }
  if (action === "cancel-student-edit") { editingStudentId = null; renderApp(); return; }
  if (action === "cancel-course-edit") { editingCourseId = null; renderApp(); return; }
  if (action === "cancel-grade-edit") { editingGradeId = null; renderApp(); return; }
  if (action === "edit-student") { editingStudentId = id; renderApp(); return; }
  if (action === "edit-course") { editingCourseId = id; renderApp(); return; }
  if (action === "edit-grade") { editingGradeId = id; renderApp(); return; }
  if (action === "delete-student") {
    const student = findUser(id);
    if (!student || !window.confirm(`¿Eliminar la cuenta de ${student.name} y todas sus notas?`)) return;
    data.users = data.users.filter(user => user.id !== id);
    data.grades = data.grades.filter(grade => grade.userId !== id);
    persist(); showFlash("Estudiante y sus notas eliminados."); renderApp(); return;
  }
  if (action === "delete-course") {
    const course = findCourse(id);
    if (!course || !window.confirm(`¿Eliminar el curso ${course.name} y sus notas asociadas?`)) return;
    data.courses = data.courses.filter(item => item.id !== id);
    data.grades = data.grades.filter(grade => grade.courseId !== id);
    persist(); showFlash("Curso y notas asociadas eliminados."); renderApp(); return;
  }
  if (action === "delete-grade") {
    if (!window.confirm("¿Eliminar este registro de nota?")) return;
    data.grades = data.grades.filter(grade => grade.id !== id);
    persist(); showFlash("Nota eliminada."); renderApp();
  }
  if (action === "reset-storage") {
    if (!window.confirm("Esto reemplazará los datos locales de la demo por los datos de ejemplo. ¿Continuar?")) return;
    data = createInitialData(); persist(); currentUser = null; renderApp();
  }
});

app.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const values = formData(form);

  if (form.id === "login-form") {
    if (!form.reportValidity()) return;
    const user = data.users.find(item => item.dni === values.dni && item.password === values.password);
    if (!user) { showFormError("DNI o contraseña incorrectos."); return; }
    currentUser = user; localStorage.setItem(SESSION_KEY, user.id); page = user.role === "admin" ? "dashboard" : "courses"; renderApp(); return;
  }

  if (form.id === "student-form") {
    if (!form.reportValidity()) return;
    if (data.users.some(user => user.dni === values.dni && user.id !== form.dataset.id)) { showFlash("Ya existe una cuenta con ese DNI."); renderApp(); return; }
    if (form.dataset.id) {
      const student = findUser(form.dataset.id);
      Object.assign(student, { name: values.name.trim(), dni: values.dni, email: values.email.trim(), career: values.career.trim() });
      editingStudentId = null;
      showFlash("Datos del estudiante actualizados.");
    } else {
      data.users.push({ id: crypto.randomUUID(), dni: values.dni, name: values.name.trim(), email: values.email.trim(), career: values.career.trim(), password: values.password, role: "student" });
      showFlash("Estudiante registrado correctamente.");
    }
    persist(); renderApp(); return;
  }

  if (form.id === "course-form") {
    if (!form.reportValidity()) return;
    const duplicate = data.courses.some(course => course.name.toLowerCase() === values.name.trim().toLowerCase() && course.period === values.period && course.id !== form.dataset.id);
    if (duplicate) { showFlash("Ya existe un curso con ese nombre en el mismo periodo lectivo."); renderApp(); return; }
    const courseValues = { name: values.name.trim(), semester: values.semester.trim(), credits: Number(values.credits), period: values.period };
    if (form.dataset.id) {
      Object.assign(findCourse(form.dataset.id), courseValues); editingCourseId = null; showFlash("Curso actualizado.");
    } else {
      data.courses.push({ id: crypto.randomUUID(), ...courseValues }); showFlash("Curso agregado correctamente.");
    }
    persist(); renderApp(); return;
  }

  if (form.id === "grade-form") {
    if (!form.reportValidity()) return;
    const duplicate = data.grades.some(grade => grade.userId === values.userId && grade.courseId === values.courseId && grade.period === values.period && grade.id !== form.dataset.id);
    if (duplicate) { showFlash("Ya existe una nota para este estudiante, curso y periodo."); renderApp(); return; }
    const gradeValues = { userId: values.userId, courseId: values.courseId, period: values.period, grade: Number(values.grade), attendance: values.attendance.trim() || "—" };
    if (form.dataset.id) {
      Object.assign(data.grades.find(grade => grade.id === form.dataset.id), gradeValues); editingGradeId = null; showFlash("Nota actualizada.");
    } else {
      data.grades.push({ id: crypto.randomUUID(), ...gradeValues }); showFlash("Nota registrada correctamente.");
    }
    persist(); renderApp(); return;
  }

  if (form.id === "period-form") {
    if (!form.reportValidity()) return;
    data.currentPeriod = values.period;
    persist(); showFlash("Periodo vigente actualizado."); renderApp(); return;
  }

  if (form.id === "password-form") {
    if (!form.reportValidity()) return;
    if (values.currentPassword !== currentUser.password) { showFlash("La contraseña actual no es correcta."); renderApp(); return; }
    if (values.newPassword !== values.passwordRepeat) { showFlash("Las nuevas contraseñas no coinciden."); renderApp(); return; }
    currentUser.password = values.newPassword;
    persist(); showFlash("Contraseña actualizada correctamente."); renderApp();
  }
});

if (data) {
  const sessionId = localStorage.getItem(SESSION_KEY);
  currentUser = sessionId ? findUser(sessionId) || null : null;
  if (currentUser?.role === "student") page = "courses";
  renderApp();
}