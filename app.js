/**
 * ==========================================================================
 * VANESSA FERNÁNDEZ & LUIS FONTEN — INVITACIÓN OFICIAL DE BODAS
 * Lógica Frontend, Cronómetros, Presentes, RSVP Familiar & Exportación PDF
 * ==========================================================================
 */

'use strict';

/* ==========================================================================
   1. OBJETO DE CONFIGURACIÓN CENTRALIZADA
   ========================================================================== */
const CONFIG = {
  // Nombres Oficiales
  NAMES: "Vanessa & Luis",
  FULL_NAMES: "Vanessa Carolina Fernández Colmenares & Luis Antonio Fonten Gómez",

  // Lista de candidatos para la foto principal en la web (Foto2)
  PHOTO_CANDIDATES: ["Foto2.jpeg", "Foto2.jpg", "Foto2.png", "Foto2.webp", "LuisVane.jpeg"],

  // Fechas y Cronómetros
  WEDDING_DATE: "2026-12-05T15:00:00",  // 05 de Diciembre de 2026 a las 3:00 PM
  RSVP_DEADLINE: "2026-11-22T23:59:59", // Cierre de Confirmaciones: 22 de Noviembre a las 23:59:59

  // Ubicación Oficial en Google Maps
  MAPS_URL: "https://maps.app.goo.gl/YEGJ85v2MsxEsgWm8",

  // Datos para Presentes (Copiado táctil)
  PRESENTES: {
    cuentaBancaria: "01050618210618500979",
    datosCompletosTransferencia: "BANCO MERCANTIL\nTITULAR: Luis Fonten\nC.I.: V-20.821.696\nTIPO: Ahorro\nCUENTA: 01050618210618500979",
    pagomovilTelefono: "04126000406",
    pagomovilCedula: "20821696",
    binanceEmail: "ing.luisfonten@gmail.com"
  },

  // Webhook de Google Apps Script Oficial de Luis
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbznKYQzW-sI_AU4ir4fZcRO0bQX1d2hqdHw0ylonOi9E89URUfdzjC7ZbAggJBLa4VJ/exec",

  // Límites y Almacenamiento
  MAX_FAMILIARES: 10,
  STORAGE_KEY: "boda_vanessa_luis_rsvp_v4"
};


/* ==========================================================================
   2. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */
const AppState = {
  familiarCount: 0,
  isSubmitting: false,
  savedRsvp: null,
  weddingTimerInterval: null,
  rsvpTimerInterval: null,
  photoCandidateIndex: 0
};


/* ==========================================================================
   3. SANEAMIENTO CONTRA INYECCIÓN EN HOJAS DE CÁLCULO (FORMULA INJECTION)
   ========================================================================== */
/**
 * Sanitiza cualquier texto de entrada:
 * 1. Elimina etiquetas HTML y caracteres no imprimibles.
 * 2. Si el texto inicia con signos que Excel o Google Sheets interpretan como fórmulas
 *    (=, +, -, @, \t, \r), lo neutraliza anteponiendo un apóstrofe (').
 */
function sanitizeInput(input) {
  if (input === null || input === undefined) return "";
  let clean = String(input).trim();
  clean = clean.replace(/<[^>]*>?/gm, "");
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  if (/^[=+@\-\t\r]/.test(clean)) {
    clean = "'" + clean;
  }
  return clean;
}


/* ==========================================================================
   4. INICIALIZACIÓN DE LA PÁGINA
   ========================================================================== */
function initializePage() {
  // Carga automática de Foto2 con fallback progresivo
  setupPhotoCandidateSequence();

  // Enlace a Google Maps
  const mapsBtn = document.getElementById("maps-link-btn");
  if (mapsBtn && CONFIG.MAPS_URL) {
    mapsBtn.href = CONFIG.MAPS_URL;
  }

  // Iniciar ambos cronómetros independientes
  startWeddingCountdown();
  startRsvpCountdown();

  // Configurar Sticky Mobile CTA sin franja de fondo y con auto-ocultación precisa
  setupStickyMobileCta();

  // Configurar eventos de presentes y copiado
  setupPresentsEvents();

  // Revisar si existe confirmación previa guardada
  checkExistingRsvp();
}


/**
 * Carga progresiva de Foto2 (.jpeg, .jpg, .png, .webp) con fallback a monograma
 */
function setupPhotoCandidateSequence() {
  const photoImg = document.getElementById("couple-photo");
  const monogram = document.getElementById("monogram-fallback");
  if (!photoImg || !monogram) return;

  function tryNextCandidate() {
    if (AppState.photoCandidateIndex < CONFIG.PHOTO_CANDIDATES.length) {
      const nextSrc = CONFIG.PHOTO_CANDIDATES[AppState.photoCandidateIndex];
      AppState.photoCandidateIndex++;
      photoImg.src = nextSrc;
    } else {
      // Si ninguno cargó, mostrar monograma caligráfico en relieve
      photoImg.style.display = "none";
      monogram.style.display = "flex";
    }
  }

  photoImg.onerror = function() {
    tryNextCandidate();
  };

  photoImg.onload = function() {
    photoImg.style.display = "block";
    monogram.style.display = "none";
  };

  tryNextCandidate();
}


/* ==========================================================================
   5. CONTADORES REGRESIVOS (BODA Y CIERRE DE RSVP)
   ========================================================================== */
/**
 * Cronómetro #1: Hacia la Boda (05 de Diciembre de 2026 a las 15:00:00)
 */
function startWeddingCountdown() {
  const targetDate = new Date(CONFIG.WEDDING_DATE).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const daysEl = document.getElementById("wedding-countdown-days");
    const hoursEl = document.getElementById("wedding-countdown-hours");
    const minutesEl = document.getElementById("wedding-countdown-minutes");
    const secondsEl = document.getElementById("wedding-countdown-seconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (AppState.weddingTimerInterval) clearInterval(AppState.weddingTimerInterval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  AppState.weddingTimerInterval = setInterval(update, 1000);
}

/**
 * Cronómetro #2: Hacia el Cierre de RSVP (22 de Noviembre de 2026 a las 23:59:59)
 */
function startRsvpCountdown() {
  const targetDate = new Date(CONFIG.RSVP_DEADLINE).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const daysEl = document.getElementById("rsvp-countdown-days");
    const hoursEl = document.getElementById("rsvp-countdown-hours");
    const minutesEl = document.getElementById("rsvp-countdown-minutes");
    const secondsEl = document.getElementById("rsvp-countdown-seconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (AppState.rsvpTimerInterval) clearInterval(AppState.rsvpTimerInterval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  AppState.rsvpTimerInterval = setInterval(update, 1000);
}


/* ==========================================================================
   6. BOTÓN FLOTANTE PERMANENTE (CTA FLOTANTE)
   Se fija al centro inferior y se oculta automáticamente al llegar a #confirmar
   ========================================================================== */
function setupStickyMobileCta() {
  const stickyBar = document.getElementById("sticky-mobile-cta");
  const rsvpSection = document.getElementById("confirmar") || document.getElementById("rsvp-section");
  const footerElement = document.getElementById("main-footer");

  if (!stickyBar) return;

  function hideSticky() {
    stickyBar.classList.add("is-hidden");
  }

  function showSticky() {
    stickyBar.classList.remove("is-hidden");
  }

  // 1. IntersectionObserver para la sección RSVP (#confirmar) y el Footer
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      let shouldHide = false;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          shouldHide = true;
        }
      });

      if (shouldHide) {
        hideSticky();
      } else {
        showSticky();
      }
    }, {
      root: null,
      threshold: 0.05
    });

    if (rsvpSection) observer.observe(rsvpSection);
    if (footerElement) observer.observe(footerElement);
  }

  // 2. Comprobación de respaldo en evento scroll al final de la página
  window.addEventListener("scroll", () => {
    const scrollPos = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Si el usuario está cerca del final de la página, ocultar
    if (scrollPos >= documentHeight - 140) {
      hideSticky();
    }
  }, { passive: true });
}


/* ==========================================================================
   7. MÓDULO DE PRESENTES (COPIADO TÁCTIL)
   ========================================================================== */
function setupPresentsEvents() {
  const toggleBtn = document.getElementById("btn-toggle-presentes");
  const optionsContent = document.getElementById("presents-options-content");
  const toggleText = document.getElementById("presents-toggle-text");

  if (toggleBtn && optionsContent) {
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", !isExpanded);
      if (isExpanded) {
        optionsContent.style.display = "none";
        if (toggleText) toggleText.textContent = "VER OPCIONES PARA PRESENTES";
      } else {
        optionsContent.style.display = "block";
        if (toggleText) toggleText.textContent = "OCULTAR OPCIONES PARA PRESENTES";
      }
    });
  }

  // Copiar Cuenta
  bindCopyButton("copy-cuenta-btn", CONFIG.PRESENTES.cuentaBancaria, "¡Número de cuenta copiado!");

  // Copiar Datos Completos de Transferencia
  bindCopyButton("copy-transferencia-completa-btn", CONFIG.PRESENTES.datosCompletosTransferencia, "¡Datos de transferencia copiados!");

  // Copiar Teléfono Pago Móvil
  bindCopyButton("copy-pagomovil-tel-btn", CONFIG.PRESENTES.pagomovilTelefono, "¡Teléfono de pago móvil copiado!");

  // Copiar Cédula Pago Móvil
  bindCopyButton("copy-pagomovil-ci-btn", CONFIG.PRESENTES.pagomovilCedula, "¡Cédula copiada!");

  // Copiar Correo Binance
  bindCopyButton("copy-binance-email-btn", CONFIG.PRESENTES.binanceEmail, "¡Correo Binance copiado!");
}

function bindCopyButton(btnId, textToCopy, successMsg) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener("click", () => {
    copyToClipboard(textToCopy, () => {
      showToast(successMsg, "success");
    });
  });
}

function copyToClipboard(text, onSuccess) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
  } else {
    fallback();
  }

  function fallback() {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (e) {
      showToast("Por favor copia el texto manualmente.", "normal");
    }
    document.body.removeChild(tempInput);
  }
}


/* ==========================================================================
   8. SISTEMA DE TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, type = "normal") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


/* ==========================================================================
   9. GESTIÓN DINÁMICA DE FAMILIARES INVITADOS (PASO 3)
   ========================================================================== */
function addFamiliarField(initialValue = "") {
  if (AppState.familiarCount >= CONFIG.MAX_FAMILIARES) {
    showToast(`Se ha alcanzado el límite máximo de ${CONFIG.MAX_FAMILIARES} familiares.`);
    return;
  }

  AppState.familiarCount++;
  const num = AppState.familiarCount + 1; // El invitado principal es #1, familiares empiezan en #2
  const container = document.getElementById("lista-familiares");
  if (!container) return;

  const card = document.createElement("div");
  card.className = "familiar-row-card";
  card.id = `familiar-row-${num}`;

  card.innerHTML = `
    <div class="familiar-row-header">
      <span class="familiar-row-label">Familiar Invitado #${num}</span>
      <button type="button" class="btn-remove-familiar" aria-label="Eliminar familiar invitado">
        ✕ Quitar
      </button>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <input 
        type="text" 
        class="form-input familiar-input-name" 
        placeholder="Nombre y Apellido del Familiar Invitado #${num}" 
        required 
        maxlength="90"
        value="${initialValue}"
      >
      <span class="field-error"></span>
    </div>
  `;

  container.appendChild(card);

  const removeBtn = card.querySelector(".btn-remove-familiar");
  removeBtn.addEventListener("click", () => {
    card.remove();
    reindexFamiliares();
  });
}

function reindexFamiliares() {
  const container = document.getElementById("lista-familiares");
  if (!container) return;
  const cards = container.querySelectorAll(".familiar-row-card");
  AppState.familiarCount = cards.length;

  cards.forEach((card, idx) => {
    const num = idx + 2;
    const label = card.querySelector(".familiar-row-label");
    const input = card.querySelector(".familiar-input-name");
    if (label) label.textContent = `Familiar Invitado #${num}`;
    if (input) input.placeholder = `Nombre y Apellido del Familiar Invitado #${num}`;
  });
}


/* ==========================================================================
   10. VALIDACIÓN Y ENVÍO SECRETO DEL FORMULARIO RSVP
   ========================================================================== */
function validateForm() {
  let isValid = true;

  // 1. Validar Nombre Principal
  const nombreInput = document.getElementById("nombre-principal");
  const errorNombre = document.getElementById("error-nombre-principal");
  if (!nombreInput.value.trim()) {
    nombreInput.classList.add("is-invalid");
    if (errorNombre) errorNombre.textContent = "Por favor ingresa tu nombre y apellido.";
    isValid = false;
  } else {
    nombreInput.classList.remove("is-invalid");
    if (errorNombre) errorNombre.textContent = "";
  }

  // 2. Validar Teléfono Principal
  const telInput = document.getElementById("telefono-principal");
  const errorTel = document.getElementById("error-telefono-principal");
  const cleanTel = telInput.value.replace(/[^0-9+]/g, "");
  if (!cleanTel || cleanTel.length < 7) {
    telInput.classList.add("is-invalid");
    if (errorTel) errorTel.textContent = "Ingresa un número de contacto o WhatsApp válido.";
    isValid = false;
  } else {
    telInput.classList.remove("is-invalid");
    if (errorTel) errorTel.textContent = "";
  }

  // 3. Validar Familiares adicionales
  const familiarCards = document.querySelectorAll(".familiar-row-card");
  familiarCards.forEach((card) => {
    const input = card.querySelector(".familiar-input-name");
    const error = card.querySelector(".field-error");
    if (input && !input.value.trim()) {
      input.classList.add("is-invalid");
      if (error) error.textContent = "Indica el nombre de este familiar o presiona ✕ Quitar.";
      isValid = false;
    } else if (input) {
      input.classList.remove("is-invalid");
      if (error) error.textContent = "";
    }
  });

  return isValid;
}

function buildPayloadFromForm() {
  const nombrePrincipal = sanitizeInput(document.getElementById("nombre-principal").value);
  const telefonoPrincipal = sanitizeInput(document.getElementById("telefono-principal").value);
  const radioVal = document.querySelector('input[name="asistencia_principal"]:checked')?.value || "Sí asistirá";
  const asistencia = radioVal.includes("No") ? "No podré asistir" : "Sí asistiré";
  const mensajeNovios = sanitizeInput(document.getElementById("mensaje-novios").value);

  const groupId = "FAM-" + Date.now();
  const timestampIso = new Date().toISOString();

  // Arreglo de strings con los nombres y apellidos de cada familiar adicional
  const familiares = [];
  const familiarCards = document.querySelectorAll(".familiar-row-card");
  familiarCards.forEach((card) => {
    const famName = sanitizeInput(card.querySelector(".familiar-input-name")?.value);
    if (famName) {
      familiares.push(famName);
    }
  });

  // Estructura de invitados para compatibilidad y visualización en el frontend
  const invitados = [
    {
      numeroEnGrupo: 1,
      tipo: "Principal",
      nombre: nombrePrincipal,
      asistencia: asistencia
    }
  ];

  familiares.forEach((famName, idx) => {
    invitados.push({
      numeroEnGrupo: idx + 2,
      tipo: "Familiar Invitado",
      nombre: famName,
      asistencia: asistencia
    });
  });

  return {
    // Campos exactos solicitados:
    idGrupo: groupId,
    asistencia: asistencia,
    nombrePrincipal: nombrePrincipal,
    telefono: telefonoPrincipal,
    mensaje: mensajeNovios,
    familiares: familiares,

    // Campos de compatibilidad con backend y resumen local:
    idGrupoFamiliar: groupId,
    fechaRegistro: timestampIso,
    confirmadoPor: nombrePrincipal,
    telefonoContacto: telefonoPrincipal,
    mensajeNovios: mensajeNovios,
    totalPersonas: 1 + familiares.length,
    invitados: invitados
  };
}

async function handleRsvpSubmit(e) {
  e.preventDefault();

  if (AppState.isSubmitting) return;

  if (!validateForm()) {
    showToast("Por favor completa los campos señalados en rojo.", "error");
    return;
  }

  AppState.isSubmitting = true;
  setSubmitLoadingState(true);

  const payload = buildPayloadFromForm();

  try {
    const hasEndpoint = CONFIG.GOOGLE_SCRIPT_URL && 
                        CONFIG.GOOGLE_SCRIPT_URL.trim() !== "" && 
                        CONFIG.GOOGLE_SCRIPT_URL.indexOf("PEGA_AQUI") === -1;

    if (hasEndpoint) {
      await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      console.info("[RSVP] Enviado a Google Sheets:", payload);
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.info("[RSVP Simulación Local] Payload guardado:", payload);
    }

    saveLocalRsvp(payload);
    displaySuccessView(payload);
    showToast("¡Confirmación recibida con éxito!", "success");

  } catch (error) {
    console.error("[RSVP Error]", error);
    saveLocalRsvp(payload);
    displaySuccessView(payload);
    showToast("Tu respuesta fue guardada localmente de manera segura.", "normal");
  } finally {
    AppState.isSubmitting = false;
    setSubmitLoadingState(false);
  }
}

function setSubmitLoadingState(loading) {
  const btn = document.getElementById("submit-rsvp-btn");
  const spinner = document.getElementById("submit-spinner");
  const btnText = document.getElementById("submit-btn-text");

  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "ENVIANDO CONFIRMACIÓN...";
  } else {
    btn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (btnText) btnText.textContent = "ENVIAR CONFIRMACIÓN";
  }
}

function displaySuccessView(payload) {
  const formEl = document.getElementById("rsvp-form");
  const successCard = document.getElementById("form-success-view");
  const summaryBox = document.getElementById("success-summary-content");

  if (!formEl || !successCard || !summaryBox) return;

  const total = payload.totalPersonas || (1 + (payload.familiares ? payload.familiares.length : 0));
  let guestsListHtml = "";
  if (payload.invitados && payload.invitados.length > 0) {
    guestsListHtml = payload.invitados.map(inv => {
      const badge = inv.tipo === "Principal" ? "(Titular)" : "(Familiar)";
      return `<li><strong>${inv.nombre}</strong> <small style="color: #46543A;">${badge}</small> — ${inv.asistencia}</li>`;
    }).join("");
  } else {
    guestsListHtml = `<li><strong>${payload.nombrePrincipal}</strong> <small style="color: #46543A;">(Titular)</small> — ${payload.asistencia}</li>`;
    if (payload.familiares) {
      payload.familiares.forEach(fam => {
        guestsListHtml += `<li><strong>${fam}</strong> <small style="color: #46543A;">(Familiar)</small> — ${payload.asistencia}</li>`;
      });
    }
  }

  summaryBox.innerHTML = `
    <p><strong>Comprobante Familiar:</strong> ${payload.idGrupo || payload.idGrupoFamiliar}</p>
    <p><strong>Registrado por:</strong> ${payload.nombrePrincipal || payload.confirmadoPor}</p>
    <p><strong>Teléfono / WhatsApp:</strong> ${payload.telefono || payload.telefonoContacto}</p>
    <p><strong>Estado de Asistencia:</strong> ${payload.asistencia}</p>
    <p style="margin-top: 10px;"><strong>Personas contempladas en este grupo (${total}):</strong></p>
    <ul style="margin-left: 20px; margin-top: 6px;">
      ${guestsListHtml}
    </ul>
    ${(payload.mensaje || payload.mensajeNovios) ? `<p style="margin-top: 10px; font-style: italic;">"${payload.mensaje || payload.mensajeNovios}"</p>` : ""}
  `;

  formEl.style.display = "none";
  successCard.style.display = "block";

  updateLocalStatusBanner(payload);
}

function saveLocalRsvp(payload) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("No se pudo escribir en localStorage", e);
  }
}

function checkExistingRsvp() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      AppState.savedRsvp = data;
      updateLocalStatusBanner(data);
    }
  } catch (e) {
    console.warn("Error leyendo localStorage", e);
  }
}

function updateLocalStatusBanner(data) {
  const banner = document.getElementById("local-status-banner");
  const summaryText = document.getElementById("status-summary-text");
  if (!banner || !summaryText) return;

  const total = data.totalPersonas || data.invitados?.length || 1;
  const countDesc = total === 1 ? "1 invitado registrado" : `${total} personas registradas`;
  summaryText.textContent = `${data.confirmadoPor} (${countDesc}) • Ref: ${data.idGrupoFamiliar}`;
  banner.style.display = "flex";
}


/* ==========================================================================
   11. DESCARGA EN PDF OFICIAL ESTILO POSTAL ARTÍSTICA (HTML2CANVAS + JSPDF)
   Renderiza el contenedor #printable-postcard (alta resolución con tipografías
   caligráficas Great Vibes, rosas en relieve y monograma botánico V&L),
   insertándolo en 1 sola página A4 e incrustando el enlace interactivo
   a Google Maps con doc.link().
   ========================================================================== */
async function generateVectorialPdf() {
  const downloadBtn = document.getElementById("download-pdf-btn");
  const heroDownloadBtn = document.getElementById("hero-download-pdf-btn");
  const btnText = document.getElementById("download-pdf-text");

  if (btnText) btnText.textContent = "GENERANDO POSTAL PDF...";
  if (downloadBtn) downloadBtn.style.opacity = "0.7";
  if (heroDownloadBtn) heroDownloadBtn.style.opacity = "0.7";

  const postcard = document.getElementById("printable-postcard");
  if (!postcard) {
    console.warn("Elemento #printable-postcard no encontrado. Abriendo vista de impresión.");
    window.print();
    return;
  }

  try {
    // 1. Asegurar que las fuentes de Google Fonts (Great Vibes, Cormorant Garamond, Montserrat) estén cargadas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Posicionar temporalmente la postal para renderizado nítido en html2canvas
    postcard.style.display = "block";
    postcard.style.position = "fixed";
    postcard.style.left = "0";
    postcard.style.top = "0";
    postcard.style.zIndex = "-9999";

    // 3. Medir coordenadas del botón de Google Maps antes del render
    const mapsBtn = document.getElementById("postcard-maps-btn");
    const cardRect = postcard.getBoundingClientRect();
    const btnRect = mapsBtn ? mapsBtn.getBoundingClientRect() : null;

    // 4. Capturar con html2canvas a escala 2.5 (~300 DPI nítido para impresión)
    const canvas = await html2canvas(postcard, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: "#F3EFE6",
      width: 794,
      height: 1123,
      windowWidth: 1200,
      logging: false
    });

    // 5. Ocultar la postal de nuevo
    postcard.style.left = "-9999px";
    postcard.style.display = "none";

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // 6. Crear el documento PDF en A4 (210 x 297 mm)
    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
      throw new Error("jsPDF no se encuentra cargado.");
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // 7. Insertar la postal con fidelidad gráfica total
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297);

    // 8. Superponer hipervínculo nativo interactivo exacto en el botón de Google Maps
    if (btnRect && cardRect.width > 0 && cardRect.height > 0) {
      const scaleX = 210 / cardRect.width;
      const scaleY = 297 / cardRect.height;
      const linkX = (btnRect.left - cardRect.left) * scaleX;
      const linkY = (btnRect.top - cardRect.top) * scaleY;
      const linkW = btnRect.width * scaleX;
      const linkH = btnRect.height * scaleY;
      doc.link(linkX, linkY, linkW, linkH, { url: CONFIG.MAPS_URL });
    }

    // 9. Guardar archivo en el navegador
    doc.save("Invitacion_Boda_Vane_y_Luis_2026.pdf");
    showToast("¡Postal oficial de bodas descargada en PDF (1 página)! ", "success");

  } catch (error) {
    console.error("[PDF Error]", error);
    showToast("Abriendo vista de impresión...", "normal");
    window.print();
  } finally {
    if (postcard) {
      postcard.style.left = "-9999px";
      postcard.style.display = "none";
    }
    if (btnText) btnText.textContent = "DESCARGAR INVITACIÓN OFICIAL EN PDF";
    if (downloadBtn) downloadBtn.style.opacity = "";
    if (heroDownloadBtn) heroDownloadBtn.style.opacity = "";
  }
}


/* ==========================================================================
   12. VINCULACIÓN DE EVENTOS DEL DOM
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initializePage();

  // Agregar Familiar Invitado (Paso 3)
  const addFamiliarBtn = document.getElementById("add-familiar-btn");
  if (addFamiliarBtn) {
    addFamiliarBtn.addEventListener("click", () => addFamiliarField());
  }

  // Envío del Formulario RSVP
  const rsvpForm = document.getElementById("rsvp-form");
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", handleRsvpSubmit);
  }

  // Botón para resetear / reabrir formulario desde vista de éxito
  const resetFormBtn = document.getElementById("reset-form-btn");
  const reopenRsvpBtn = document.getElementById("reopen-rsvp-btn");
  const successCard = document.getElementById("form-success-view");

  function showFormAgain() {
    if (rsvpForm && successCard) {
      rsvpForm.style.display = "block";
      successCard.style.display = "none";
    }
  }

  if (resetFormBtn) resetFormBtn.addEventListener("click", showFormAgain);
  if (reopenRsvpBtn) reopenRsvpBtn.addEventListener("click", showFormAgain);

  // Descargar PDF desde los botones
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", generateVectorialPdf);
  }

  const heroDownloadPdfBtn = document.getElementById("hero-download-pdf-btn");
  if (heroDownloadPdfBtn) {
    heroDownloadPdfBtn.addEventListener("click", generateVectorialPdf);
  }
});
