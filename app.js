/**
 * ==========================================================================
 * LA BODA DE LUIS & VANE — LANDING PAGE VSL MOBILE-FIRST
 * Arquitectura Frontend, Lógica de Cuenta Regresiva, Colaboración & RSVP
 * ==========================================================================
 */

'use strict';

/* ==========================================================================
   1. OBJETO DE CONFIGURACIÓN CENTRALIZADA (EDITA AQUÍ FÁCILMENTE)
   ========================================================================== */
const CONFIG = {
  // --- Nombres Principales & Textos Ceremoniales ---
  NAMES_DISPLAY: "Luis & Vane",
  BLESSING_TEXT: "CON LA BENDICIÓN DE DIOS Y NUESTRAS FAMILIAS • CELEBRAMOS NUESTRA UNIÓN",
  PHOTO_PATH: "LuisVane.jpeg", // Fotografía de la pareja (o "nosotros.jpg")

  // --- Cuenta Regresiva (Objetivo: 05 de Diciembre de 2026 a las 3:00 PM) ---
  COUNTDOWN_TARGET: "2026-12-05T15:00:00",

  // --- Preludio Íntimo: Ceremonia Civil (04 de Diciembre de 2026) ---
  CIVIL: {
    fechaTexto: "CEREMONIA CIVIL • 04 DE DICIEMBRE DE 2026",
    horaTexto: "HORA: 11:00 AM (REGISTRO CIVIL)",
    descripcion: "La firma de nuestra unión legal con la presencia de nuestros familiares más cercanos.",
    mostrarPreguntaEnRsvp: true // Pon false si no deseas preguntar por el Civil en el RSVP general
  },

  // --- Evento Principal: Celebración y Compartir (05 de Diciembre de 2026) ---
  EVENT_MONTH: "DICIEMBRE",
  EVENT_DAY: "05",
  EVENT_YEAR: "2026",
  EVENT_TIME: "A LAS TRES DE LA TARDE (3:00 PM)",
  EVENT_PLACE: "LOMAS DEL ÁVILA • CARACAS",

  // --- Ubicación & Navegación ---
  GOOGLE_MAPS_URL: "https://maps.google.com/?q=Lomas+del+Avila+Caracas+Venezuela",

  // --- Código de Vestimenta (Dresscode) ---
  DRESSCODE: {
    titulo: "DRESSCODE",
    subtitulo: "ELEGANCIA FORMAL",
    mensaje: "Queremos que luzcan elegantes y cómodos para celebrar este día junto a nosotros.",
    // Paleta de colores sugerida: puedes agregar o cambiar los colores aquí
    paletaColores: [
      { nombre: "Azul Medianoche", hex: "#1D2A44" },
      { nombre: "Verde Salvia", hex: "#68785A" },
      { nombre: "Champagne / Marfil", hex: "#EAE4D7" },
      { nombre: "Terracota Cálido", hex: "#B86B53" },
      { nombre: "Rosa Palo", hex: "#D9A8A0" }
    ]
  },

  // --- Apartado de Colaboración / Presente (NUEVO) ---
  COLABORACION: {
    titulo: "DETALLE DE CARIÑO & COLABORACIÓN",
    mensaje: "Su presencia y compañía en este día tan especial es nuestro mejor regalo. Si desean tener un detalle o colaborar con el inicio de nuestra vida juntos, hemos dispuesto este espacio con mucho cariño. (Detalles próximamente)",
    mostrarDatosExtra: true, // Pon true para habilitar el bloque desplegable con datos bancarios
    datosBancarios: "BANCO: Mercantil\nTITULAR: Luis & Vanessa\nCUENTA: 0105-XXXX-XX-XXXXXXXXXX\nPAGO MÓVIL: 0414-XXXXXXX / CI: V-XXXXXXXX\nZELLE / OTROS: consultar con los novios."
  },

  // --- Fecha Límite de Confirmación (RSVP) ---
  RSVP_DEADLINE_TEXT: "FAVOR CONFIRMAR ASISTENCIA ANTES DEL 20 DE NOVIEMBRE",

  // --- Conexión con Google Apps Script (Backend de Hojas de Cálculo) ---
  // Pega aquí la URL Web App generada desde google-apps-script-backend.gs
  // Si se deja vacío (""), funcionará en Modo Simulación Local respaldando en localStorage.
  GOOGLE_SCRIPT_URL: "",

  // --- Límites Operativos ---
  MAX_COMPANIONS: 8,
  STORAGE_KEY: "boda_luis_vane_rsvp_v2"
};


/* ==========================================================================
   2. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */
const AppState = {
  companionCount: 0,
  isSubmitting: false,
  savedRsvp: null,
  countdownInterval: null
};


/* ==========================================================================
   3. SANEAMIENTO CONTRA INYECCIÓN EN HOJAS DE CÁLCULO (FORMULA INJECTION)
   ========================================================================== */
/**
 * Sanitiza cualquier texto de entrada:
 * 1. Elimina etiquetas HTML y caracteres no imprimibles.
 * 2. Si el texto inicia con fórmulas (=, +, -, @, \t, \r), neutraliza anteponiendo un apóstrofe (').
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
   4. INICIALIZACIÓN DE LA PÁGINA DESDE CONFIG
   ========================================================================== */
function initializeFromConfig() {
  // Sección 1: Hero
  const blessingEl = document.getElementById("hero-blessing-text");
  if (blessingEl) blessingEl.textContent = CONFIG.BLESSING_TEXT;

  const monthEl = document.getElementById("hero-month-text");
  if (monthEl) monthEl.textContent = CONFIG.EVENT_MONTH;

  const dayEl = document.getElementById("hero-day-text");
  if (dayEl) dayEl.textContent = CONFIG.EVENT_DAY;

  const yearEl = document.getElementById("hero-year-text");
  if (yearEl) yearEl.textContent = CONFIG.EVENT_YEAR;

  const locSubEl = document.getElementById("hero-location-sub");
  if (locSubEl) locSubEl.textContent = `${CONFIG.EVENT_PLACE}, VENEZUELA`;

  // Sección 2: Dos Fechas
  const civilDescEl = document.getElementById("civil-card-desc");
  if (civilDescEl) civilDescEl.textContent = CONFIG.CIVIL.descripcion;

  const civilTimeEl = document.getElementById("civil-card-time");
  if (civilTimeEl) civilTimeEl.textContent = CONFIG.CIVIL.horaTexto;

  const mainTimeEl = document.getElementById("main-card-time");
  if (mainTimeEl) mainTimeEl.textContent = CONFIG.EVENT_TIME;

  const mainPlaceEl = document.getElementById("main-card-place");
  if (mainPlaceEl) mainPlaceEl.textContent = CONFIG.EVENT_PLACE;

  // Sección 3: Ubicación y Dresscode
  const mapsBtn = document.getElementById("maps-link-btn");
  if (mapsBtn && CONFIG.GOOGLE_MAPS_URL) mapsBtn.href = CONFIG.GOOGLE_MAPS_URL;

  const dresscodeTitle = document.getElementById("dresscode-title");
  if (dresscodeTitle) dresscodeTitle.textContent = CONFIG.DRESSCODE.titulo;

  const dresscodeSub = document.getElementById("dresscode-subtitle");
  if (dresscodeSub) dresscodeSub.textContent = CONFIG.DRESSCODE.subtitulo;

  const dresscodeNote = document.getElementById("dresscode-note");
  if (dresscodeNote) dresscodeNote.textContent = CONFIG.DRESSCODE.mensaje;

  renderPaletteDots();

  // Sección 4: Colaboración / Presente
  const colabTitle = document.getElementById("colaboracion-title");
  if (colabTitle) colabTitle.textContent = CONFIG.COLABORACION.titulo;

  const colabMsg = document.getElementById("colaboracion-message");
  if (colabMsg) colabMsg.textContent = CONFIG.COLABORACION.mensaje;

  const colabModule = document.getElementById("colaboracion-extra-module");
  const colabInfoBox = document.getElementById("colaboracion-info-box");
  if (colabModule && colabInfoBox) {
    if (CONFIG.COLABORACION.mostrarDatosExtra) {
      colabModule.style.display = "block";
      // Formato con saltos de línea legibles
      colabInfoBox.innerHTML = CONFIG.COLABORACION.datosBancarios.replace(/\n/g, "<br>");
    } else {
      colabModule.style.display = "none";
    }
  }

  // Sección 5: RSVP
  const rsvpDeadline = document.getElementById("rsvp-deadline-text");
  if (rsvpDeadline) rsvpDeadline.textContent = CONFIG.RSVP_DEADLINE_TEXT;

  const civilOptionGroup = document.getElementById("civil-option-group");
  if (civilOptionGroup && !CONFIG.CIVIL.mostrarPreguntaEnRsvp) {
    civilOptionGroup.style.display = "none";
  }

  // Fotografía con fallback a monograma
  setupPhotoWithFallback();

  // Iniciar Cuenta Regresiva
  startCountdownTimer();

  // Configurar Sticky Mobile CTA con IntersectionObserver
  setupStickyMobileCta();

  // Comprobar confirmaciones previas en este navegador
  checkExistingRsvp();
}


/**
 * Renderiza dinámicamente las bolitas de colores de la paleta sugerida
 */
function renderPaletteDots() {
  const container = document.getElementById("palette-dots-container");
  if (!container || !CONFIG.DRESSCODE.paletaColores) return;

  container.innerHTML = "";
  CONFIG.DRESSCODE.paletaColores.forEach(color => {
    const dot = document.createElement("span");
    dot.className = "palette-dot";
    dot.style.backgroundColor = color.hex;
    dot.title = `${color.nombre} (${color.hex})`;
    dot.setAttribute("aria-label", color.nombre);
    container.appendChild(dot);
  });
}


/**
 * Manejo de la foto con monograma caligráfico en relieve si no existe
 */
function setupPhotoWithFallback() {
  const photoImg = document.getElementById("couple-photo");
  const monogram = document.getElementById("monogram-fallback");
  if (!photoImg || !monogram) return;

  photoImg.src = CONFIG.PHOTO_PATH;

  photoImg.onerror = function() {
    if (photoImg.src.indexOf("nosotros.jpg") === -1 && CONFIG.PHOTO_PATH !== "nosotros.jpg") {
      photoImg.src = "nosotros.jpg";
      photoImg.onerror = function() {
        photoImg.style.display = "none";
        monogram.style.display = "flex";
      };
    } else {
      photoImg.style.display = "none";
      monogram.style.display = "flex";
    }
  };
}


/* ==========================================================================
   5. CONTADOR REGRESIVO EN TIEMPO REAL (DÍAS, HORAS, MIN, SEG)
   ========================================================================== */
function startCountdownTimer() {
  const targetDate = new Date(CONFIG.COUNTDOWN_TARGET).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const daysEl = document.getElementById("countdown-days");
    const hoursEl = document.getElementById("countdown-hours");
    const minutesEl = document.getElementById("countdown-minutes");
    const secondsEl = document.getElementById("countdown-seconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (AppState.countdownInterval) clearInterval(AppState.countdownInterval);
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
  AppState.countdownInterval = setInterval(update, 1000);
}


/* ==========================================================================
   6. BARRA FLOTANTE INFERIOR EN MÓVIL (STICKY CTA CON INTERSECTION OBSERVER)
   ========================================================================== */
function setupStickyMobileCta() {
  const stickyBar = document.getElementById("sticky-mobile-cta");
  const rsvpSection = document.getElementById("rsvp-section");

  if (!stickyBar || !rsvpSection) return;

  // Usa IntersectionObserver para ocultar la barra flotante cuando la sección RSVP esté a la vista
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // El usuario está viendo la sección RSVP: ocultar barra flotante
          stickyBar.classList.add("is-hidden");
        } else {
          // El usuario está arriba: mostrar barra flotante
          stickyBar.classList.remove("is-hidden");
        }
      });
    }, {
      root: null,
      threshold: 0.15
    });

    observer.observe(rsvpSection);
  }
}


/* ==========================================================================
   7. INTERACCIÓN DE COLABORACIÓN / COPIAR DATOS
   ========================================================================== */
function setupColaboracionEvents() {
  const toggleBtn = document.getElementById("btn-toggle-colaboracion");
  const content = document.getElementById("colaboracion-details-content");
  const toggleText = document.getElementById("colaboracion-toggle-text");
  const copyBtn = document.getElementById("btn-copy-colaboracion");
  const copyBtnText = document.getElementById("copy-btn-text");

  if (toggleBtn && content) {
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", !isExpanded);
      if (isExpanded) {
        content.style.display = "none";
        if (toggleText) toggleText.textContent = "Ver información de colaboración";
      } else {
        content.style.display = "block";
        if (toggleText) toggleText.textContent = "Ocultar información de colaboración";
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const textToCopy = CONFIG.COLABORACION.datosBancarios;
      
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(onCopySuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function onCopySuccess() {
        if (copyBtnText) copyBtnText.textContent = "¡DATOS COPIADOS AL PORTAPAPELES!";
        showToast("¡Datos de colaboración copiados con éxito!", "success");
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "COPIAR DATOS DE COLABORACIÓN";
        }, 3000);
      }

      function fallbackCopy() {
        const tempTextarea = document.createElement("textarea");
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        try {
          document.execCommand("copy");
          onCopySuccess();
        } catch (err) {
          showToast("No se pudo copiar automáticamente. Por favor selecciónalo.", "normal");
        }
        document.body.removeChild(tempTextarea);
      }
    });
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
   9. GESTIÓN DINÁMICA DE ACOMPAÑANTES Y FAMILIARES
   ========================================================================== */
function addCompanionField(initialData = null) {
  if (AppState.companionCount >= CONFIG.MAX_COMPANIONS) {
    showToast(`Se ha alcanzado el límite máximo de ${CONFIG.MAX_COMPANIONS} acompañantes.`);
    return;
  }

  AppState.companionCount++;
  const index = AppState.companionCount;
  const container = document.getElementById("companions-container");
  if (!container) return;

  const card = document.createElement("div");
  card.className = "companion-card";
  card.id = `companion-row-${index}`;

  const showCivil = CONFIG.CIVIL.mostrarPreguntaEnRsvp;

  card.innerHTML = `
    <div class="companion-header">
      <span class="companion-number">Acompañante / Familiar #${index}</span>
      <button type="button" class="btn-remove-companion" data-id="${index}" aria-label="Eliminar acompañante">
        ✕ Quitar
      </button>
    </div>
    
    <div class="form-group">
      <label class="form-label" for="comp-nombre-${index}">
        Nombre y Apellido del Acompañante <span class="required">*</span>
      </label>
      <input 
        type="text" 
        id="comp-nombre-${index}" 
        name="comp_nombre_${index}" 
        class="form-input comp-input-name" 
        placeholder="Ej. Nombre completo del familiar" 
        required 
        maxlength="90"
        value="${initialData && initialData.nombre ? initialData.nombre : ''}"
      >
      <span class="field-error" id="error-comp-nombre-${index}"></span>
    </div>

    <div class="form-group">
      <span class="form-label">¿Asiste a la Celebración del 5 de Diciembre?</span>
      <div class="radio-pill-group">
        <label class="radio-pill">
          <input type="radio" name="comp_asiste_5_${index}" value="SI" ${!initialData || initialData.asiste5Dic === 'SI' ? 'checked' : ''}>
          <span>Sí Asiste</span>
        </label>
        <label class="radio-pill">
          <input type="radio" name="comp_asiste_5_${index}" value="NO" ${initialData && initialData.asiste5Dic === 'NO' ? 'checked' : ''}>
          <span>No Asiste</span>
        </label>
      </div>
    </div>

    ${showCivil ? `
      <div class="form-group">
        <span class="form-label">¿Asiste a la Ceremonia Civil (4 Dic)?</span>
        <div class="radio-pill-group">
          <label class="radio-pill">
            <input type="radio" name="comp_asiste_4_${index}" value="SI" ${initialData && initialData.asiste4Dic === 'SI' ? 'checked' : ''}>
            <span>Sí al Civil</span>
          </label>
          <label class="radio-pill">
            <input type="radio" name="comp_asiste_4_${index}" value="NO" ${!initialData || initialData.asiste4Dic === 'NO' ? 'checked' : ''}>
            <span>No al Civil</span>
          </label>
        </div>
      </div>
    ` : ''}

    <div class="form-group">
      <label class="form-label" for="comp-restriccion-${index}">
        Preferencia o Restricción Alimentaria
      </label>
      <select id="comp-restriccion-${index}" name="comp_restriccion_${index}" class="form-select comp-select-restriccion">
        <option value="Ninguna">Ninguna (Menú tradicional)</option>
        <option value="Vegetariano">Vegetariano</option>
        <option value="Vegano">Vegano</option>
        <option value="Sin Gluten">Sin Gluten (Celíaco)</option>
        <option value="Alergia">Alergia específica</option>
      </select>
    </div>
  `;

  container.appendChild(card);

  const removeBtn = card.querySelector(".btn-remove-companion");
  removeBtn.addEventListener("click", () => {
    card.remove();
    reindexCompanions();
  });
}

function reindexCompanions() {
  const container = document.getElementById("companions-container");
  if (!container) return;
  const cards = container.querySelectorAll(".companion-card");
  AppState.companionCount = cards.length;

  cards.forEach((card, idx) => {
    const num = idx + 1;
    const title = card.querySelector(".companion-number");
    if (title) title.textContent = `Acompañante / Familiar #${num}`;
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
    if (errorTel) errorTel.textContent = "Ingresa un número de teléfono o WhatsApp válido.";
    isValid = false;
  } else {
    telInput.classList.remove("is-invalid");
    if (errorTel) errorTel.textContent = "";
  }

  // 3. Validar Acompañantes
  const compCards = document.querySelectorAll(".companion-card");
  compCards.forEach((card) => {
    const compInput = card.querySelector(".comp-input-name");
    const errorComp = card.querySelector(".field-error");
    if (compInput && !compInput.value.trim()) {
      compInput.classList.add("is-invalid");
      if (errorComp) errorComp.textContent = "Indica el nombre de este acompañante o quita la fila.";
      isValid = false;
    } else if (compInput) {
      compInput.classList.remove("is-invalid");
      if (errorComp) errorComp.textContent = "";
    }
  });

  return isValid;
}

function buildPayloadFromForm() {
  const nombrePrincipal = sanitizeInput(document.getElementById("nombre-principal").value);
  const telefonoPrincipal = sanitizeInput(document.getElementById("telefono-principal").value);
  
  const asiste5Principal = document.querySelector('input[name="asiste_5_dic_principal"]:checked')?.value || "SI";
  const asiste4Principal = document.querySelector('input[name="asiste_4_dic_principal"]:checked')?.value || "NO";

  const restriccionSelect = document.getElementById("restriccion-principal").value;
  let restriccionPrincipal = restriccionSelect;
  if (restriccionSelect === "Alergia") {
    const otraAlergia = sanitizeInput(document.getElementById("otra-alergia-principal").value);
    restriccionPrincipal = otraAlergia ? `Alergia: ${otraAlergia}` : "Alergia no especificada";
  }

  const mensajeNovios = sanitizeInput(document.getElementById("mensaje-novios").value);

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const familyId = `FAM-${dateStamp}-${randomSuffix}`;
  const timestampIso = now.toISOString();

  const invitados = [
    {
      rol: "Principal",
      nombre: nombrePrincipal,
      telefono: telefonoPrincipal,
      asiste5Dic: asiste5Principal,
      asiste4Dic: asiste4Principal,
      restriccion: restriccionPrincipal
    }
  ];

  const compCards = document.querySelectorAll(".companion-card");
  compCards.forEach((card, idx) => {
    const num = idx + 1;
    const compName = sanitizeInput(card.querySelector(".comp-input-name")?.value);
    const compAsiste5 = card.querySelector(`input[name="comp_asiste_5_${num}"]:checked`)?.value || "SI";
    const compAsiste4 = card.querySelector(`input[name="comp_asiste_4_${num}"]:checked`)?.value || "NO";
    const compRestriccion = card.querySelector(".comp-select-restriccion")?.value || "Ninguna";

    if (compName) {
      invitados.push({
        rol: "Acompañante",
        nombre: compName,
        telefono: telefonoPrincipal,
        asiste5Dic: compAsiste5,
        asiste4Dic: compAsiste4,
        restriccion: compRestriccion
      });
    }
  });

  return {
    idGrupoFamiliar: familyId,
    fechaRegistro: timestampIso,
    confirmadoPor: nombrePrincipal,
    telefonoContacto: telefonoPrincipal,
    mensajeNovios: mensajeNovios,
    totalPersonas: invitados.length,
    invitados: invitados
  };
}

async function handleRsvpSubmit(e) {
  e.preventDefault();

  if (AppState.isSubmitting) return;

  if (!validateForm()) {
    showToast("Por favor revisa los campos señalados en rojo.", "error");
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
        headers: {
          "Content-Type": "application/json"
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
    if (btnText) btnText.textContent = "ENVIANDO...";
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

  let guestsListHtml = payload.invitados.map(inv => {
    const civilTag = CONFIG.CIVIL.mostrarPreguntaEnRsvp && inv.asiste4Dic === "SI" 
      ? " <small style='color: #68785A;'>(Civil + Celebración)</small>" 
      : "";
    const statusText = inv.asiste5Dic === "SI" ? "✓ Asiste" : "✕ No asiste";
    return `<li><strong>${inv.nombre}</strong>: ${statusText}${civilTag}</li>`;
  }).join("");

  summaryBox.innerHTML = `
    <p><strong>Comprobante Familiar:</strong> ${payload.idGrupoFamiliar}</p>
    <p><strong>Registrado por:</strong> ${payload.confirmadoPor}</p>
    <p><strong>Contacto:</strong> ${payload.telefonoContacto}</p>
    <p style="margin-top: 10px;"><strong>Detalle de Asistencia (${payload.totalPersonas} ${payload.totalPersonas === 1 ? 'persona' : 'personas'}):</strong></p>
    <ul style="margin-left: 20px; margin-top: 6px;">
      ${guestsListHtml}
    </ul>
    ${payload.mensajeNovios ? `<p style="margin-top: 10px; font-style: italic;">"${payload.mensajeNovios}"</p>` : ""}
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
  const countDesc = total === 1 ? "1 invitado registrado" : `${total} invitados registrados`;
  summaryText.textContent = `${data.confirmadoPor} (${countDesc}) • Ref: ${data.idGrupoFamiliar}`;
  banner.style.display = "flex";
}


/* ==========================================================================
   11. DESCARGA EN PDF DE ALTA PRECISIÓN (html2pdf.js)
   ========================================================================== */
function handleDownloadPdf() {
  const postcardElement = document.getElementById("printable-postcard");
  const downloadBtn = document.getElementById("download-pdf-btn");
  const btnText = document.getElementById("download-pdf-text");

  if (!postcardElement) return;

  if (typeof html2pdf === "undefined") {
    window.print();
    return;
  }

  if (btnText) btnText.textContent = "GENERANDO PDF...";
  if (downloadBtn) downloadBtn.style.opacity = "0.7";

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Invitacion_Boda_Luis_y_Vane_${CONFIG.EVENT_YEAR}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: "#DDD6CA"
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    }
  };

  // Posicionar temporalmente el canvas visible para la captura
  postcardElement.style.position = "static";
  postcardElement.style.left = "0";
  postcardElement.style.top = "0";

  html2pdf()
    .set(opt)
    .from(postcardElement)
    .save()
    .then(() => {
      showToast("¡Invitación descargada en PDF exitosamente!", "success");
    })
    .catch((err) => {
      console.error("[PDF Error]", err);
      showToast("Abriendo vista de impresión...", "normal");
      window.print();
    })
    .finally(() => {
      // Restaurar fuera de pantalla
      postcardElement.style.position = "absolute";
      postcardElement.style.left = "-9999px";
      postcardElement.style.top = "-9999px";
      if (btnText) btnText.textContent = "DESCARGAR INVITACIÓN EN PDF";
      if (downloadBtn) downloadBtn.style.opacity = "";
    });
}


/* ==========================================================================
   12. VINCULACIÓN DE EVENTOS DEL DOM
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initializeFromConfig();
  setupColaboracionEvents();

  // Reabrir / Resetear formulario desde vista de éxito
  const resetFormBtn = document.getElementById("reset-form-btn");
  const reopenRsvpBtn = document.getElementById("reopen-rsvp-btn");
  const formEl = document.getElementById("rsvp-form");
  const successCard = document.getElementById("form-success-view");

  function showFormAgain() {
    if (formEl && successCard) {
      formEl.style.display = "block";
      successCard.style.display = "none";
    }
  }

  if (resetFormBtn) resetFormBtn.addEventListener("click", showFormAgain);
  if (reopenRsvpBtn) reopenRsvpBtn.addEventListener("click", showFormAgain);

  // Alergia específica condicional
  const restriccionSelect = document.getElementById("restriccion-principal");
  const otraAlergiaInput = document.getElementById("otra-alergia-principal");
  if (restriccionSelect && otraAlergiaInput) {
    restriccionSelect.addEventListener("change", (e) => {
      if (e.target.value === "Alergia") {
        otraAlergiaInput.style.display = "block";
        otraAlergiaInput.focus();
      } else {
        otraAlergiaInput.style.display = "none";
      }
    });
  }

  // Agregar Acompañante
  const addCompanionBtn = document.getElementById("add-companion-btn");
  if (addCompanionBtn) {
    addCompanionBtn.addEventListener("click", () => addCompanionField());
  }

  // Envío RSVP
  if (formEl) {
    formEl.addEventListener("submit", handleRsvpSubmit);
  }

  // Descargar PDF
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", handleDownloadPdf);
  }
});
