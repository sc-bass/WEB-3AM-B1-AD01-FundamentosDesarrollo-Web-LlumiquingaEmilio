"use strict";
/* ===== AutoTaller Pro · Sistema Web de Mantenimiento Automotriz ===== */

/* ---------- Datos base ---------- */
const KEY_USR = "ma_usuarios", KEY_SOL = "ma_solicitudes", KEY_SES = "ma_sesion";
const ESTADOS = ["Pendiente", "En revisión", "En proceso", "Finalizado", "Cancelado"];
const BADGE = { "Pendiente": "warning", "En revisión": "info", "En proceso": "primary", "Finalizado": "success", "Cancelado": "danger" };
const MARCAS = ["Chevrolet", "Kia", "Hyundai", "Toyota", "Mazda", "Nissan", "Renault", "Ford", "Volkswagen", "Otra"];
const SERVICIOS = [
  { id: "aceite", nombre: "Cambio de aceite y filtros", icono: "bi-droplet-half", desc: "Aceite sintético o mineral, filtros de aceite y aire.", precio: "Desde $35" },
  { id: "frenos", nombre: "Revisión y cambio de frenos", icono: "bi-disc", desc: "Pastillas, discos, líquido y prueba de frenado.", precio: "Desde $60" },
  { id: "alineacion", nombre: "Alineación y balanceo", icono: "bi-bullseye", desc: "Alineación computarizada y balanceo de llantas.", precio: "Desde $30" },
  { id: "diagnostico", nombre: "Diagnóstico electrónico", icono: "bi-cpu", desc: "Lectura de códigos de falla con scanner profesional.", precio: "Desde $25" },
  { id: "suspension", nombre: "Suspensión y dirección", icono: "bi-truck", desc: "Amortiguadores, rótulas, terminales y cajetín.", precio: "Desde $80" },
  { id: "general", nombre: "Mantenimiento preventivo general", icono: "bi-tools", desc: "Inspección completa de 20 puntos y ajustes.", precio: "Desde $90" }
];
const usuariosBase = [
  { id: 1, nombre: "Administrador del Taller", identificacion: "1700000001", telefono: "0990000001", email: "admin@autotallerpro.ec", usuario: "admin", clave: "Admin123", rol: "Administrador", activo: true },
  { id: 2, nombre: "Carlos Mendoza", identificacion: "1710000002", telefono: "0991234567", email: "carlos@correo.com", usuario: "carlos", clave: "Cliente123", rol: "Cliente", activo: true },
  { id: 3, nombre: "María Fernández", identificacion: "1710000003", telefono: "0987654321", email: "maria@correo.com", usuario: "maria", clave: "Cliente123", rol: "Cliente", activo: true },
  { id: 4, nombre: "Luis Torres", identificacion: "1710000004", telefono: "0981112233", email: "luis@correo.com", usuario: "luis", clave: "Cliente123", rol: "Cliente", activo: false }
];
const solicitudesBase = [
  { id: 1, clienteId: 2, nombre: "Carlos Mendoza", identificacion: "1710000002", telefono: "0991234567", email: "carlos@correo.com", placa: "PBC-1234", marca: "Chevrolet", modelo: "Sail", anio: 2018, km: 54000, servicio: "aceite", fecha: "2026-11-20", hora: "09:00", modalidad: "En taller", extras: ["Lavado exterior"], obs: "Ruido leve al encender.", estado: "Pendiente" },
  { id: 2, clienteId: 2, nombre: "Carlos Mendoza", identificacion: "1710000002", telefono: "0991234567", email: "carlos@correo.com", placa: "PBC-1234", marca: "Chevrolet", modelo: "Sail", anio: 2018, km: 54000, servicio: "frenos", fecha: "2026-11-25", hora: "14:30", modalidad: "Recogida a domicilio", extras: [], obs: "", estado: "En proceso" },
  { id: 3, clienteId: 3, nombre: "María Fernández", identificacion: "1710000003", telefono: "0987654321", email: "maria@correo.com", placa: "GAB-567", marca: "Kia", modelo: "Rio", anio: 2020, km: 31000, servicio: "general", fecha: "2026-12-02", hora: "10:00", modalidad: "En taller", extras: ["Diagnóstico electrónico", "Inspección de 20 puntos"], obs: "Revisión antes de viaje.", estado: "En revisión" }
];

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cargar = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; } };
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const alerta = (icon, title, text) => Swal.fire({ icon, title, text, confirmButtonColor: "#ff6b1a" });
const toast = (title) => Swal.fire({ toast: true, position: "top-end", icon: "success", title, showConfirmButton: false, timer: 1800 });
const nombreServicio = id => (SERVICIOS.find(s => s.id === id) || { nombre: id }).nombre;
const badge = estado => `<span class="badge text-bg-${BADGE[estado] || "secondary"}">${esc(estado)}</span>`;
function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------- Estado de la aplicación ---------- */
let usuarios = cargar(KEY_USR, usuariosBase);
let solicitudes = cargar(KEY_SOL, solicitudesBase);
let sesion = cargar(KEY_SES, null);
let editandoId = null;
guardar(KEY_USR, usuarios);
guardar(KEY_SOL, solicitudes);

const actual = () => (sesion ? usuarios.find(u => u.id === sesion.id) || null : null);
const esAdmin = () => { const u = actual(); return !!u && u.rol === "Administrador" && u.activo; };
function requireAdmin() {
  if (!esAdmin()) { alerta("error", "Acceso denegado", "Esta operación es exclusiva del Administrador."); return false; }
  return true;
}

/* ---------- Navegación ---------- */
function irA(v) {
  const u = actual();
  if (v === "admin") {
    if (!u) { alerta("info", "Inicia sesión", "Debes ingresar para continuar."); v = "login"; }
    else if (!esAdmin()) { return alerta("error", "Acceso denegado", "El rol Cliente no puede entrar al módulo de Administración."); }
  } else if ((v === "solicitud" || v === "panel") && !u) {
    alerta("info", "Inicia sesión", "Ingresa para registrar y consultar tus mantenimientos.");
    v = "login";
  }
  document.querySelectorAll(".vista").forEach(s => s.classList.add("d-none"));
  $("v-" + v).classList.remove("d-none");
  document.querySelectorAll(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.go === v));
  if (v === "panel") renderPanel();
  if (v === "admin") renderAdmin();
  if (v === "solicitud") prepararForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
  const m = $("menu");
  if (m.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(m).hide();
}

function actualizarUI() {
  const u = actual();
  document.querySelectorAll('[data-auth="user"]').forEach(el => el.classList.toggle("d-none", !u));
  document.querySelectorAll('[data-auth="guest"]').forEach(el => el.classList.toggle("d-none", !!u));
  $("navUser").textContent = u ? `${u.nombre.split(" ")[0]} · ${u.rol}` : "";
}

/* ---------- Catálogo y selects ---------- */
function renderCatalogo() {
  $("gridServicios").innerHTML = SERVICIOS.map(s => `
    <div class="col-md-6 col-lg-4"><div class="svc">
      <div class="ico"><i class="bi ${s.icono}"></i></div>
      <h4>${esc(s.nombre)}</h4><p class="text-secondary">${esc(s.desc)}</p>
      <div class="price mb-2">${esc(s.precio)}</div>
      <button class="btn btn-outline-dark btn-sm" data-servicio="${s.id}">Solicitar este servicio</button>
    </div></div>`).join("");
  $("f-servicio").innerHTML = '<option value="">Selecciona...</option>' + SERVICIOS.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join("");
  $("f-marca").innerHTML = '<option value="">Selecciona...</option>' + MARCAS.map(m => `<option>${m}</option>`).join("");
  $("filtroEstado").innerHTML = '<option value="">Todos los estados</option>' + ESTADOS.map(e => `<option>${e}</option>`).join("");
}

/* ---------- Login / Logout ---------- */
function login(e) {
  e.preventDefault();
  const usr = $("loginUser").value.trim().toLowerCase();
  const pass = $("loginPass").value;
  if (!usr || !pass) return alerta("warning", "Campos obligatorios", "Ingresa usuario y contraseña.");
  const user = usuarios.find(x => x.usuario === usr && x.clave === pass);
  if (!user) return alerta("error", "Acceso inválido", "Usuario o contraseña incorrectos.");
  if (!user.activo) return alerta("error", "Cuenta deshabilitada", "Tu cuenta está deshabilitada. Contacta al administrador.");
  sesion = { id: user.id };
  guardar(KEY_SES, sesion);
  $("formLogin").reset();
  actualizarUI();
  toast(`Bienvenido, ${user.nombre.split(" ")[0]}`);
  irA(user.rol === "Administrador" ? "admin" : "panel");
}
function logout() {
  sesion = null; editandoId = null;
  localStorage.removeItem(KEY_SES);
  actualizarUI();
  irA("inicio");
}

/* ---------- Formulario de solicitud (Módulo 2) ---------- */
function rellenarCliente(u) {
  if (!u) return;
  $("f-nombre").value = u.nombre; $("f-id").value = u.identificacion;
  $("f-tel").value = u.telefono; $("f-email").value = u.email;
}
function limpiarForm() {
  $("formSolicitud").reset();
  document.querySelectorAll("#formSolicitud .is-invalid").forEach(x => x.classList.remove("is-invalid"));
  editandoId = null;
  $("tituloForm").textContent = "Solicitud de mantenimiento";
  $("btnGuardar").innerHTML = '<i class="bi bi-check2-circle"></i> Registrar solicitud';
  $("f-fecha").min = hoy();
  prepararForm();
}
function prepararForm() {
  const u = actual(); if (!u) return;
  $("f-fecha").min = hoy();
  $("wrapCliente").classList.toggle("d-none", !esAdmin());
  if (esAdmin()) {
    const prev = $("f-cliente").value;
    $("f-cliente").innerHTML = usuarios.filter(x => x.activo).map(x => `<option value="${x.id}">${esc(x.nombre)} (${x.rol})</option>`).join("");
    if (prev) $("f-cliente").value = prev;
  }
  if (editandoId === null) {
    rellenarCliente(esAdmin() ? usuarios.find(x => x.id === Number($("f-cliente").value)) : u);
  }
}
function leerForm() {
  const radio = document.querySelector('input[name="modalidad"]:checked');
  const extras = [...document.querySelectorAll('input[name="extras"]:checked')].map(c => c.value);
  const km = $("f-km").value, anio = $("f-anio").value;
  return {
    clienteId: esAdmin() ? Number($("f-cliente").value) : actual().id,
    nombre: $("f-nombre").value.trim(), identificacion: $("f-id").value.trim(),
    telefono: $("f-tel").value.trim(), email: $("f-email").value.trim(),
    placa: $("f-placa").value.trim().toUpperCase(), marca: $("f-marca").value,
    modelo: $("f-modelo").value.trim(), anio: anio === "" ? NaN : Number(anio),
    km: km === "" ? NaN : Number(km), servicio: $("f-servicio").value,
    fecha: $("f-fecha").value, hora: $("f-hora").value,
    modalidad: radio ? radio.value : "", extras, obs: $("f-obs").value.trim(),
    acepto: $("f-acepto").checked
  };
}
/* Devuelve un arreglo de pares [idCampo, mensaje]; vacío = válido */
function validarSolicitud(d, previo) {
  const err = [];
  const anioMax = new Date().getFullYear() + 1;
  if (d.nombre.length < 3 || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(d.nombre)) err.push(["f-nombre", "El nombre es obligatorio (solo letras, mínimo 3)."]);
  if (!/^\d{10}$/.test(d.identificacion)) err.push(["f-id", "La identificación debe tener 10 dígitos."]);
  if (!/^(09\d{8}|0[2-7]\d{7})$/.test(d.telefono)) err.push(["f-tel", "Teléfono inválido (ej. 0991234567 o 022456789)."]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) err.push(["f-email", "Correo electrónico inválido."]);
  if (!/^[A-Z]{3}-\d{3,4}$/.test(d.placa)) err.push(["f-placa", "Placa inválida. Formato: ABC-123 o ABC-1234."]);
  if (!d.marca) err.push(["f-marca", "Selecciona la marca."]);
  if (d.modelo.length < 2) err.push(["f-modelo", "Ingresa el modelo del vehículo."]);
  if (!Number.isInteger(d.anio) || d.anio < 1980 || d.anio > anioMax) err.push(["f-anio", `El año debe estar entre 1980 y ${anioMax}.`]);
  if (!Number.isInteger(d.km) || d.km < 0 || d.km > 1000000) err.push(["f-km", "El kilometraje debe ser un entero entre 0 y 1.000.000."]);
  if (!SERVICIOS.some(s => s.id === d.servicio)) err.push(["f-servicio", "Selecciona un tipo de servicio."]);
  if (!d.fecha) err.push(["f-fecha", "Selecciona la fecha."]);
  else {
    const mismaFecha = previo && previo.fecha === d.fecha;
    if (d.fecha < hoy() && !mismaFecha) err.push(["f-fecha", "La fecha no puede ser anterior a hoy."]);
    else if (new Date(d.fecha + "T00:00:00").getDay() === 0) err.push(["f-fecha", "El taller no atiende los domingos."]);
  }
  if (!d.hora || d.hora < "08:00" || d.hora > "17:00") err.push(["f-hora", "El horario de atención es de 08:00 a 17:00."]);
  if (!d.modalidad) err.push(["f-mod1", "Selecciona la modalidad de atención."]);
  if (d.obs.length > 300) err.push(["f-obs", "Las observaciones no pueden superar 300 caracteres."]);
  if (!d.acepto) err.push(["f-acepto", "Debes confirmar que los datos son correctos."]);
  return err;
}
function guardarSolicitud(e) {
  e.preventDefault();
  if (!actual()) return irA("login");
  if (editandoId !== null && !requireAdmin()) return;
  const previo = editandoId !== null ? solicitudes.find(s => s.id === editandoId) : null;
  const d = leerForm();
  document.querySelectorAll("#formSolicitud .is-invalid").forEach(x => x.classList.remove("is-invalid"));
  const errs = validarSolicitud(d, previo);
  if (errs.length) {
    errs.forEach(([id]) => $(id).classList.add("is-invalid"));
    return Swal.fire({ icon: "error", title: "No se guardó la solicitud", html: "<ul class='text-start small'>" + errs.map(([, m]) => `<li>${m}</li>`).join("") + "</ul>", confirmButtonColor: "#ff6b1a" });
  }
  if (previo) {
    Object.assign(previo, d);
    toast("Solicitud actualizada");
  } else {
    const nuevoId = Math.max(0, ...solicitudes.map(s => s.id)) + 1;
    solicitudes.push({ id: nuevoId, ...d, estado: "Pendiente" });
    toast(`Solicitud N.º ${nuevoId} registrada`);
  }
  guardar(KEY_SOL, solicitudes);
  limpiarForm();
  irA(esAdmin() ? "admin" : "panel");
}

/* ---------- Panel del cliente ---------- */
function renderPanel() {
  const u = actual(); if (!u) return;
  $("perfil").innerHTML = `
    <div class="avatar"><i class="bi bi-person-fill"></i></div>
    <h4 class="mb-0">${esc(u.nombre)}</h4>
    <span class="badge text-bg-dark mb-3">${esc(u.rol)}</span>
    <ul class="list-unstyled small mb-0">
      <li class="mb-1"><i class="bi bi-person-badge"></i> Usuario: <b>${esc(u.usuario)}</b></li>
      <li class="mb-1"><i class="bi bi-card-text"></i> Identificación: ${esc(u.identificacion)}</li>
      <li class="mb-1"><i class="bi bi-telephone"></i> ${esc(u.telefono)}</li>
      <li class="mb-1"><i class="bi bi-envelope"></i> ${esc(u.email)}</li>
      <li><i class="bi bi-check-circle"></i> Cuenta: ${u.activo ? "Activa" : "Deshabilitada"}</li>
    </ul>`;
  const mias = solicitudes.filter(s => s.clienteId === u.id);
  $("tbMios").innerHTML = mias.length ? mias.map(s => `
    <tr><td>#${s.id}</td><td>${esc(s.placa)}</td><td>${esc(nombreServicio(s.servicio))}</td>
    <td>${esc(s.fecha)} ${esc(s.hora)}</td><td>${badge(s.estado)}</td></tr>`).join("")
    : '<tr><td colspan="5" class="text-center text-secondary py-4">Aún no tienes mantenimientos registrados.</td></tr>';
}

/* ---------- Panel del administrador ---------- */
function renderAdmin() {
  if (!esAdmin()) return;
  let chips = "";
  for (const e of ESTADOS) {
    chips += `<div class="col-6 col-md"><div class="sum"><b>${solicitudes.filter(s => s.estado === e).length}</b><span class="small text-secondary">${e}</span></div></div>`;
  }
  $("resumen").innerHTML = chips;

  const q = $("buscar").value.trim().toLowerCase(), fe = $("filtroEstado").value;
  const lista = solicitudes.filter(s => (!fe || s.estado === fe) && (!q || s.placa.toLowerCase().includes(q) || s.nombre.toLowerCase().includes(q)));
  $("tbAdmin").innerHTML = lista.length ? lista.map(s => `
    <tr><td>#${s.id}</td><td>${esc(s.nombre)}<br><small class="text-secondary">${esc(s.telefono)}</small></td>
    <td>${esc(s.placa)}<br><small class="text-secondary">${esc(s.marca)} ${esc(s.modelo)} ${s.anio} · ${Number(s.km).toLocaleString("es-EC")} km</small></td>
    <td>${esc(nombreServicio(s.servicio))}</td><td>${esc(s.fecha)}<br><small>${esc(s.hora)}</small></td>
    <td><select class="form-select form-select-sm" data-estado="${s.id}">${ESTADOS.map(e => `<option ${e === s.estado ? "selected" : ""}>${e}</option>`).join("")}</select></td>
    <td class="text-end text-nowrap">
      <button class="btn btn-sm btn-outline-primary" data-act="editar" data-id="${s.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
      <button class="btn btn-sm btn-outline-danger" data-act="eliminar" data-id="${s.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
    </td></tr>`).join("")
    : '<tr><td colspan="7" class="text-center text-secondary py-4">No hay solicitudes que coincidan.</td></tr>';

  const clientes = usuarios.filter(u => u.rol === "Cliente");
  $("tbClientes").innerHTML = clientes.map(c => `
    <tr><td>${esc(c.nombre)}</td><td>${esc(c.usuario)}</td><td>${esc(c.email)}</td>
    <td>${solicitudes.filter(s => s.clienteId === c.id).length}</td>
    <td>${c.activo ? '<span class="badge text-bg-success">Activa</span>' : '<span class="badge text-bg-secondary">Deshabilitada</span>'}</td>
    <td class="text-end"><button class="btn btn-sm btn-outline-dark" data-cliente="${c.id}">${c.activo ? "Deshabilitar" : "Habilitar"}</button></td></tr>`).join("");
}
function cambiarEstado(id, estado) {
  if (!requireAdmin()) return;
  const s = solicitudes.find(x => x.id === id);
  if (!s || !ESTADOS.includes(estado)) return;
  s.estado = estado;
  guardar(KEY_SOL, solicitudes);
  renderAdmin();
  toast(`Solicitud #${id}: ${estado}`);
}
function editarSolicitud(id) {
  if (!requireAdmin()) return;
  const s = solicitudes.find(x => x.id === id); if (!s) return;
  editandoId = id;
  irA("solicitud");
  $("f-cliente").value = s.clienteId;
  $("f-nombre").value = s.nombre; $("f-id").value = s.identificacion; $("f-tel").value = s.telefono; $("f-email").value = s.email;
  $("f-placa").value = s.placa; $("f-marca").value = s.marca; $("f-modelo").value = s.modelo;
  $("f-anio").value = s.anio; $("f-km").value = s.km; $("f-servicio").value = s.servicio;
  $("f-fecha").value = s.fecha; $("f-hora").value = s.hora; $("f-obs").value = s.obs;
  document.querySelectorAll('input[name="modalidad"]').forEach(r => { r.checked = r.value === s.modalidad; });
  document.querySelectorAll('input[name="extras"]').forEach(c => { c.checked = s.extras.includes(c.value); });
  $("f-acepto").checked = true;
  $("tituloForm").textContent = `Editando solicitud #${id}`;
  $("btnGuardar").innerHTML = '<i class="bi bi-save"></i> Guardar cambios';
}
function eliminarSolicitud(id) {
  if (!requireAdmin()) return;
  Swal.fire({ icon: "warning", title: `¿Eliminar la solicitud #${id}?`, text: "Esta acción no se puede deshacer.", showCancelButton: true, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", confirmButtonColor: "#dc3545" })
    .then(r => {
      if (!r.isConfirmed || !requireAdmin()) return;
      solicitudes = solicitudes.filter(s => s.id !== id);
      guardar(KEY_SOL, solicitudes);
      renderAdmin();
      toast("Solicitud eliminada");
    });
}
function alternarCliente(id) {
  if (!requireAdmin()) return;
  const c = usuarios.find(u => u.id === id);
  if (!c || c.rol !== "Cliente") return;
  c.activo = !c.activo;
  guardar(KEY_USR, usuarios);
  renderAdmin();
  toast(`Cuenta de ${c.nombre.split(" ")[0]} ${c.activo ? "habilitada" : "deshabilitada"}`);
}

/* ---------- Eventos ---------- */
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) { e.preventDefault(); irA(go.dataset.go); return; }
  const sv = e.target.closest("[data-servicio]");
  if (sv) { irA("solicitud"); if (actual()) $("f-servicio").value = sv.dataset.servicio; }
});
$("formLogin").addEventListener("submit", login);
$("btnSalir").addEventListener("click", logout);
$("formSolicitud").addEventListener("submit", guardarSolicitud);
$("btnCancelarEdicion").addEventListener("click", limpiarForm);
$("f-cliente").addEventListener("change", () => { if (editandoId === null) rellenarCliente(usuarios.find(u => u.id === Number($("f-cliente").value))); });
$("f-placa").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase(); });
$("buscar").addEventListener("input", renderAdmin);
$("filtroEstado").addEventListener("change", renderAdmin);
$("tbAdmin").addEventListener("change", e => {
  const sel = e.target.closest("select[data-estado]");
  if (sel) cambiarEstado(Number(sel.dataset.estado), sel.value);
});
$("tbAdmin").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const id = Number(b.dataset.id);
  if (b.dataset.act === "editar") editarSolicitud(id);
  if (b.dataset.act === "eliminar") eliminarSolicitud(id);
});
$("tbClientes").addEventListener("click", e => {
  const b = e.target.closest("button[data-cliente]");
  if (b) alternarCliente(Number(b.dataset.cliente));
});

/* ---------- Inicio ---------- */
renderCatalogo();
if (sesion && !(actual() && actual().activo)) { sesion = null; localStorage.removeItem(KEY_SES); }
actualizarUI();
irA("inicio");
