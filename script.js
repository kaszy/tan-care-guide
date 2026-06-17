/* ============================================================
   Tan'n'go Treatment Guide — Script
   All timeline logic, rendering, countdowns, and scroll UX
   ============================================================ */

'use strict';

/* ── Stage Configuration ────────────────────────────────────
   Each stage has:
     id                 – unique identifier
     startsAtHours      – base hours relative to appointment when this stage begins
                          (negative = before, positive = after)
     adjustForRinseTime – when true, the effective start is:
                          startsAtHours + rinseTimeHours
                          This lets post-rinse stages shift automatically with
                          different spray tan solutions (rapid 1-3h vs overnight 8h+)
     label              – short display name used in the timeline nav
     title              – card heading (placeholder)
     subtitle           – card subheading (placeholder)
     icon               – HTML entity / emoji for the card icon
     isAppointment      – marks the appointment node in the progress timeline
     countdown          – optional { target, label }
                          target: 'appointment' | 'firstRinse'
     checklist          – array of placeholder strings
     image              – include image placeholder if truthy
     notes              – placeholder tip text
   ──────────────────────────────────────────────────────── */
const STAGES = [
  {
    id: 'early',
    startsAtHours: -9999,
    label: 'Minimum 14 dni',
    title: 'Zabiegi kosmetyczne',
    subtitle: 'Ingerencja w naskórek',
    icon: '&#127807;',
    checklist: [
      'Zabiegi kosmetyczne ingerujące w naskórek wykonaj minimum 14 dni przed zabiegiem opalania.',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: '7days',
    startsAtHours: -168,   // 7 days before appointment
    label: '7 dni przed',
    title: 'Samoopalacze',
    subtitle: 'Subtitle placeholder',
    icon: '&#10024;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Nie należy używać innych produktów samoopalających na tydzień przed zabiegiem',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: '48hours',
    startsAtHours: -48,    // 48 hours before appointment
    label: '48 godzin przed',
    title: 'Depilacja',
    subtitle: 'Subtitle placeholder',
    icon: '&#128703;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Depilację wykonaj co najmniej 48 godzin przed zabiegiem',
      'Zminimalizujesz ryzyko, że podczas opalania natryskowego coś pójdzie nie tak lub efekt Cię nie zadowoli',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: '24hours',
    startsAtHours: -24,    // 24 hours before appointment
    label: '24 godziny przed',
    title: 'Peeling',
    subtitle: 'Subtitle placeholder',
    icon: '&#128167;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Wykonaj peeling 24 godziny przed zabiegiem (np. podczas kąpieli)',
      'Zwróć szczególną uwagę na dłonie, plecy, łokcie, kolana, kostki i problematyczne suche obszary',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: 'appointmentDay',
    startsAtHours: -6,     // same-day final prep (6 hours before)
    label: 'Dzień Wizyty',
    title: 'Prysznic',
    subtitle: 'Subtitle placeholder',
    icon: '&#128197;',
    countdown: { target: 'appointment', label: 'Until your treatment' },
    checklist: [
      'Weź prysznic',
      'Umyj skórę preparatem do higieny intymnej (kwaśne = naturalne dla skóry pH)',
      'Upewnij się, że Twoja skóra jest czysta i sucha',
      'Nie nakładaj niczego na skórę - żadnych balsamów, antyperspirantów, perfum, kremów oraz innych kosmetyków',
      'Zopatrz się w ciemne, luźne i wygodne ubrania'
    ],
    image: false,
    notes: 'Takie ubrania pomogą zminimalizować ryzyko zabarwienia tkaniny oraz wytarcia jeszcze nie do końca wchłoniętego materiału ze skóry.',
  },
  {
    id: 'treatment',
    startsAtHours: 0,      // at appointment time
    label: 'Treatment',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#128167;',
    isAppointment: true,
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: 'development',
    startsAtHours: 1,      // 1 hour after treatment completes
    // No adjustForRinseTime — development begins right after treatment
    // regardless of how long the client will wait before rinsing.
    label: 'Development',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#8987;',
    countdown: { target: 'firstRinse', label: 'Until your first rinse' },
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: 'firstRinse',
    // startsAtHours: 0 + rinseTimeHours  →  stage begins exactly at the rinse time.
    // Example: rapid solution 1h → effective = 1h after appointment
    //          overnight solution 8h → effective = 8h after appointment
    startsAtHours: 0,
    adjustForRinseTime: true,
    label: 'First Rinse',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#128703;',
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: 'aftercare',
    // startsAtHours: 16 + rinseTimeHours  →  starts ~16 hours after the rinse.
    // With default 8h rinse: effective = 24h after appointment (same as before).
    // With rapid 1h rinse:   effective = 17h after appointment.
    startsAtHours: 16,
    adjustForRinseTime: true,
    label: 'Aftercare',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#127800;',
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: 'fading',
    startsAtHours: 168,    // 7 days after appointment — absolute, no rinse adjustment
    label: 'Fading',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#127769;',
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    // Booking CTA — appears 14 days after appointment.
    // Excluded from the progress timeline (hideFromTimeline) and from stage
    // detection (isBookingCTA) so it never displaces a real guide step.
    // The booking link comes from config.bookingUrl in the URL.
    id: 'nextBooking',
    startsAtHours: 336,    // 14 days after appointment
    isBookingCTA: true,
    hideFromTimeline: true,
    label: 'Co dalej?',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    ctaText: 'Zarezerwuj wizytę',
  },
];

// Stages that appear in the progress timeline.
// Booking CTAs and any other non-journey cards are excluded.
const GUIDE_STAGES = STAGES.filter(s => !s.hideFromTimeline);

/* ── Timing Defaults ────────────────────────────────────────
   Used when `rinseTime` is not provided in the URL config.
   ──────────────────────────────────────────────────────── */
const TIMING = {
  treatmentDurationHours: 1,    // length of the treatment itself
  defaultRinseHours: 8,         // fallback rinse time (hours after appointment)
};


/* ============================================================
   URL CONFIG  —  encode / decode
   ============================================================
   The page receives all parameters as a single base64-encoded
   JSON object in the `?c=` query parameter:

     ?c=<encodeConfig({ t: '2026-06-20T17:00:00', rinseTime: 3 })>

   Current config shape:
     t           {string}  ISO 8601 appointment timestamp (required)
     rinseTime   {number}  Hours after appointment for first rinse (optional)
     bookingUrl  {string}  Booksy (or other) booking link shown on the CTA card (optional)

   The shape is intentionally open — add new keys without breaking
   existing encoded links (unknown keys are silently ignored).
   ============================================================ */

/**
 * Encode an arbitrary config object to a URL-safe base64 string.
 *
 * Uses TextEncoder so any Unicode values in future config fields
 * are handled correctly.
 *
 * @param  {object} config
 * @returns {string}  base64 string, safe to use as a query param value
 *
 * @example
 *   encodeConfig({ t: '2026-06-20T17:00:00', rinseTime: 3 })
 *   // → "eyJ0IjoiMjAyNi0wNi0yMFQxNzowMDowMCIsInJpbnNlVGltZSI6M30="
 */
function encodeConfig(config) {
  const json   = JSON.stringify(config);
  const bytes  = new TextEncoder().encode(json);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binary);
}

/**
 * Decode a base64 string produced by `encodeConfig` back to a plain object.
 * Returns `null` on any error (malformed base64, invalid JSON, etc.) so
 * callers can fall back to a generic / no-timestamp view gracefully.
 *
 * @param  {string} encoded
 * @returns {object|null}
 *
 * @example
 *   decodeConfig('eyJ0IjoiMjAyNi0wNi0yMFQxNzowMDowMCIsInJpbnNlVGltZSI6M30=')
 *   // → { t: '2026-06-20T17:00:00', rinseTime: 3 }
 */
function decodeConfig(encoded) {
  try {
    const binary = atob(encoded);
    const bytes  = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    const json   = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Read and decode the page config from the `?c=` URL parameter.
 * Returns `null` when the parameter is absent or the payload is invalid.
 *
 * @returns {object|null}  decoded config object, or null
 */
function parsePageConfig() {
  try {
    const params  = new URLSearchParams(window.location.search);
    const encoded = params.get('c');
    if (!encoded) return null;
    return decodeConfig(encoded);
  } catch {
    return null;
  }
}


/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Compute the effective start time (in hours from appointment) for a stage,
 * applying the rinse-time offset when the stage has `adjustForRinseTime: true`.
 *
 * @param  {object} stage           – stage config object
 * @param  {number} rinseTimeHours  – resolved rinse time for this session
 * @returns {number}
 */
function getEffectiveStartHours(stage, rinseTimeHours) {
  return stage.adjustForRinseTime
    ? stage.startsAtHours + rinseTimeHours
    : stage.startsAtHours;
}

/**
 * Return the current time offset in hours from the appointment.
 * Negative = before appointment, positive = after.
 *
 * @param  {Date} appointmentDate
 * @returns {number}
 */
function getHoursOffset(appointmentDate) {
  return (Date.now() - appointmentDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Determine which stage is currently active based on the hours offset.
 * The active stage is the last one whose effective start <= hoursOffset.
 *
 * @param  {number} hoursOffset
 * @param  {number} rinseTimeHours
 * @returns {object}  stage config object
 */
function detectCurrentStage(hoursOffset, rinseTimeHours) {
  // Use only guide stages — booking CTAs must never become the "active" stage
  // as they are not part of the treatment journey.
  let active = GUIDE_STAGES[0];
  for (const stage of GUIDE_STAGES) {
    if (hoursOffset >= getEffectiveStartHours(stage, rinseTimeHours)) {
      active = stage;
    } else {
      break;
    }
  }
  return active;
}

/**
 * Return the status of a stage relative to the active stage.
 *
 * @param  {string} stageId
 * @param  {string} activeStageId
 * @returns {'past'|'current'|'future'}
 */
function getStageStatus(stageId, activeStageId) {
  const stageIdx  = STAGES.findIndex(s => s.id === stageId);
  const activeIdx = STAGES.findIndex(s => s.id === activeStageId);
  if (stageIdx < activeIdx)   return 'past';
  if (stageIdx === activeIdx) return 'current';
  return 'future';
}

/**
 * Format a Date for display in the header badge.
 *
 * @param  {Date} date
 * @returns {string}
 */
function formatAppointmentDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day:     'numeric',
    month:   'long',
    hour:    '2-digit',
    minute:  '2-digit',
  });
}

/**
 * Calculate the time remaining until a target Date.
 *
 * @param  {Date} targetDate
 * @returns {{days:number, hours:number, minutes:number, seconds:number}|null}
 *          null when the target is in the past
 */
function getTimeUntil(targetDate) {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalSecs = Math.floor(diffMs / 1000);
  return {
    days:    Math.floor(totalSecs / 86400),
    hours:   Math.floor((totalSecs % 86400) / 3600),
    minutes: Math.floor((totalSecs % 3600)  / 60),
    seconds: totalSecs % 60,
  };
}

/**
 * Pad a number to at least 2 characters.
 *
 * @param  {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Resolve the target Date object for a countdown config.
 * The 'firstRinse' target uses `rinseTimeHours` from the URL config (or default),
 * so countdowns automatically reflect the actual solution being used.
 *
 * @param  {{target: string, label: string}} countdownCfg
 * @param  {Date}   appointmentDate
 * @param  {number} rinseTimeHours
 * @returns {Date}
 */
function resolveCountdownTarget(countdownCfg, appointmentDate, rinseTimeHours) {
  if (countdownCfg.target === 'firstRinse') {
    return new Date(appointmentDate.getTime() + rinseTimeHours * 3600 * 1000);
  }
  // Default: countdown to appointment
  return appointmentDate;
}

/**
 * Build the inner HTML string for a countdown element.
 *
 * @param  {string} label
 * @param  {{days,hours,minutes,seconds}|null} timeObj
 * @returns {string}
 */
function buildCountdownHTML(label, timeObj) {
  const labelHTML = `<div class="countdown__label">${label}</div>`;

  if (!timeObj) {
    return `${labelHTML}
      <div class="countdown__display">
        <span class="countdown__passed">This milestone has passed</span>
      </div>`;
  }

  const showDays = timeObj.days > 0;

  const daysHTML = showDays ? `
    <div class="countdown__unit">
      <span class="countdown__value" data-unit="days">${pad(timeObj.days)}</span>
      <span class="countdown__unit-label">days</span>
    </div>
    <span class="countdown__sep" aria-hidden="true">:</span>
  ` : '';

  return `${labelHTML}
    <div class="countdown__display">
      ${daysHTML}
      <div class="countdown__unit">
        <span class="countdown__value" data-unit="hours">${pad(timeObj.hours)}</span>
        <span class="countdown__unit-label">hours</span>
      </div>
      <span class="countdown__sep" aria-hidden="true">:</span>
      <div class="countdown__unit">
        <span class="countdown__value" data-unit="minutes">${pad(timeObj.minutes)}</span>
        <span class="countdown__unit-label">min</span>
      </div>
      <span class="countdown__sep" aria-hidden="true">:</span>
      <div class="countdown__unit">
        <span class="countdown__value" data-unit="seconds">${pad(timeObj.seconds)}</span>
        <span class="countdown__unit-label">sec</span>
      </div>
    </div>`;
}


/* ============================================================
   RENDERING
   ============================================================ */

/**
 * Render the appointment date into the header badge.
 *
 * @param {Date|null} appointmentDate
 */
function renderAppointmentBadge(appointmentDate) {
  const el = document.getElementById('appointment-badge');
  if (!appointmentDate) {
    el.innerHTML = `<span class="appointment-badge__label">General guide</span>`;
    return;
  }
  el.innerHTML = `
    <span class="appointment-badge__label">Your appointment</span>
    <span class="appointment-badge__date">${formatAppointmentDate(appointmentDate)}</span>
  `;
}

/**
 * Render the full progress timeline into the sticky nav.
 *
 * @param {string} activeStageId
 */
function renderProgressTimeline(activeStageId) {
  const container = document.getElementById('progress-timeline-inner');
  // Timeline only shows guide stages — booking CTAs are excluded
  const activeIdx = GUIDE_STAGES.findIndex(s => s.id === activeStageId);
  const progressPct = GUIDE_STAGES.length > 1
    ? (activeIdx / (GUIDE_STAGES.length - 1)) * 100
    : 0;

  const nodesHTML = GUIDE_STAGES.map((stage, idx) => {
    let statusClass = 'is-future';
    if (idx < activeIdx)   statusClass = 'is-past';
    if (idx === activeIdx) statusClass = 'is-active';

    const apptClass = stage.isAppointment ? ' is-appointment' : '';

    return `
      <div class="timeline-node ${statusClass}${apptClass}"
           role="button"
           tabindex="0"
           data-stage-id="${stage.id}"
           aria-label="Go to: ${stage.label}"
           aria-current="${idx === activeIdx ? 'step' : 'false'}"
           onclick="scrollToStage('${stage.id}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();scrollToStage('${stage.id}');}">
        <div class="timeline-node__dot" aria-hidden="true"></div>
        <span class="timeline-node__label">${stage.label}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="timeline-track" aria-hidden="true">
      <div class="timeline-track__fill" style="width:${progressPct}%"></div>
    </div>
    ${nodesHTML}
  `;
}

/**
 * Update only the active state of timeline nodes (called by scroll observer).
 *
 * @param {string} visibleStageId  – the stage currently centred in the viewport
 */
function updateTimelineActive(visibleStageId) {
  const activeIdx = GUIDE_STAGES.findIndex(s => s.id === visibleStageId);
  // Booking CTAs are not in GUIDE_STAGES — ignore to keep the last guide step highlighted
  if (activeIdx === -1) return;

  const nodes = document.querySelectorAll('.timeline-node');

  nodes.forEach((node, idx) => {
    node.classList.remove('is-past', 'is-active', 'is-future');
    node.setAttribute('aria-current', 'false');

    if (idx < activeIdx) {
      node.classList.add('is-past');
      return;
    }
    if (idx === activeIdx) {
      node.classList.add('is-active');
      node.setAttribute('aria-current', 'step');
      return;
    }
    node.classList.add('is-future');
  });

  // Animate the progress fill
  const fill = document.querySelector('.timeline-track__fill');
  if (fill && GUIDE_STAGES.length > 1) {
    fill.style.width = `${(activeIdx / (GUIDE_STAGES.length - 1)) * 100}%`;
  }

  // Keep the active node visible in the horizontally-scrollable timeline
  const activeNode = document.querySelector(`.timeline-node[data-stage-id="${visibleStageId}"]`);
  if (activeNode) {
    activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

/**
 * Build a single checklist item as an HTML string.
 *
 * @param  {string} text
 * @returns {string}
 */
function buildChecklistItemHTML(text) {
  const checkSVG = `<svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
    <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  return `
    <li class="checklist__item">
      <span class="checklist__item-check">${checkSVG}</span>
      <span>${text}</span>
    </li>
  `;
}

/**
 * Render all stage cards into the main container.
 * Booking CTA cards (isBookingCTA) are rendered with a distinct dark template
 * preceded by an end-of-guide divider.
 *
 * @param {string}      activeStageId
 * @param {Date|null}   appointmentDate
 * @param {number}      rinseTimeHours  – resolved rinse time for this session
 * @param {string|null} bookingUrl      – Booksy booking link from URL config
 */
function renderStages(activeStageId, appointmentDate, rinseTimeHours, bookingUrl) {
  const container = document.getElementById('stages-container');

  STAGES.forEach((stage, idx) => {
    /* ── Booking CTA card ─────────────────────────────────── */
    if (stage.isBookingCTA) {
      // End-of-guide divider — visually signals the guide is over
      const divider = document.createElement('div');
      divider.className = 'guide-end-divider';
      divider.setAttribute('aria-hidden', 'true');
      divider.innerHTML = `
        <div class="guide-end-divider__line"></div>
        <span class="guide-end-divider__text">Koniec zaleceń</span>
        <div class="guide-end-divider__line"></div>
      `;
      container.appendChild(divider);

      // Validate booking URL before rendering as a link
      const hasLink = typeof bookingUrl === 'string' && bookingUrl.startsWith('http');
      const btnHTML = hasLink
        ? `<a class="booksy-btn" href="${bookingUrl}" target="_blank" rel="noopener noreferrer">
             ${stage.ctaText || 'Book now'} &#8599;
           </a>`
        : `<span class="booksy-btn booksy-btn--disabled">${stage.ctaText || 'Book now'}</span>`;

      const section = document.createElement('section');
      section.id        = `stage-${stage.id}`;
      section.className = 'stage-section stage-section--booking';
      section.setAttribute('aria-label', stage.label);
      section.style.animationDelay = `${idx * 55}ms`;

      section.innerHTML = `
        <div class="booksy-logo" aria-label="Booksy">
          <div class="booksy-logo__mark" aria-hidden="true">b</div>
          <span class="booksy-logo__word" aria-hidden="true">booksy</span>
        </div>
        <p class="booking-cta__eyebrow">${stage.label}</p>
        <h2 class="booking-cta__title">${stage.title}</h2>
        <p class="booking-cta__subtitle">${stage.subtitle}</p>
        ${btnHTML}
      `;

      container.appendChild(section);
      return;
    }

    /* ── Regular guide stage card ─────────────────────────── */
    const status = getStageStatus(stage.id, activeStageId);

    const badgeLabel = { current: 'Bieżący krok', past: 'Ukończone', future: 'Nadchodzące' }[status];
    const badgeClass = `stage-badge--${status}`;

    // Countdown — only rendered when an appointment date is available
    let countdownHTML = '';
    if (stage.countdown && appointmentDate) {
      const targetDate = resolveCountdownTarget(stage.countdown, appointmentDate, rinseTimeHours);
      const timeObj    = getTimeUntil(targetDate);
      countdownHTML = `
        <div class="countdown"
             data-countdown-target="${targetDate.toISOString()}"
             data-countdown-label="${stage.countdown.label}">
          ${buildCountdownHTML(stage.countdown.label, timeObj)}
        </div>
      `;
    }

    const checklistHTML = stage.checklist && stage.checklist.length
      ? `<div>
          <p class="sub-label">Checklist</p>
          <ul class="checklist">
            ${stage.checklist.map(buildChecklistItemHTML).join('')}
          </ul>
        </div>`
      : '';

    const imageHTML = stage.image
      ? `<div class="img-placeholder">
          <span class="img-placeholder__icon" aria-hidden="true">&#128444;</span>
          <span>Image placeholder</span>
        </div>`
      : '';

    const notesHTML = stage.notes
      ? `<div class="stage-notes">
          <p class="sub-label">Tip</p>
          <p>${stage.notes}</p>
        </div>`
      : '';

    const section = document.createElement('section');
    section.id        = `stage-${stage.id}`;
    section.className = `stage-section is-${status}`;
    section.setAttribute('aria-label', stage.label);
    section.style.animationDelay = `${idx * 55}ms`;

    section.innerHTML = `
      <div class="stage-header">
        <div class="stage-header__icon" aria-hidden="true">${stage.icon}</div>
        <div class="stage-header__text">
          <p class="stage-header__timeline-label">${stage.label}</p>
          <h2 class="stage-header__title">${stage.title}</h2>
          <p class="stage-header__subtitle">${stage.subtitle}</p>
        </div>
        <div class="stage-header__badge-wrap">
          <span class="stage-badge ${badgeClass}">
            <span class="stage-badge__dot" aria-hidden="true"></span>
            ${badgeLabel}
          </span>
        </div>
      </div>

      ${countdownHTML}

      <div class="stage-body">
        ${checklistHTML}
        ${imageHTML}
        ${notesHTML}
      </div>
    `;

    container.appendChild(section);
  });
}


/* ============================================================
   SCROLL
   ============================================================ */

/**
 * Smoothly scroll to a stage card by id.
 *
 * @param {string} stageId
 */
function scrollToStage(stageId) {
  const el = document.getElementById(`stage-${stageId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Set up an IntersectionObserver that updates the timeline active node
 * as the user scrolls through stage cards.
 *
 * The observer watches only the middle band of the viewport so the timeline
 * highlights whichever card is most prominently visible.
 */
function initScrollObserver() {
  // Exclude booking CTA cards so scrolling into them doesn't shift the timeline
  const sections = document.querySelectorAll('.stage-section:not(.stage-section--booking)');
  if (!sections.length) return;

  // Track when each section last became visible so we can resolve ties
  const intersecting = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const id = entry.target.id.replace('stage-', '');
        if (entry.isIntersecting) {
          intersecting.set(id, Date.now());
        } else {
          intersecting.delete(id);
        }
      });

      if (intersecting.size === 0) return;

      // Prefer the section that most recently entered the observation zone
      let latestId   = null;
      let latestTime = -Infinity;
      intersecting.forEach((time, id) => {
        if (time > latestTime) { latestTime = time; latestId = id; }
      });

      if (latestId) updateTimelineActive(latestId);
    },
    {
      rootMargin: '-30% 0px -30% 0px',
      threshold:  0,
    }
  );

  sections.forEach(s => observer.observe(s));
}


/* ============================================================
   COUNTDOWNS
   ============================================================ */

/**
 * Start a 1-second interval for every countdown element on the page.
 * The target date is stored in `data-countdown-target` (ISO string) so
 * countdowns are fully self-contained after the initial render.
 */
function startCountdowns() {
  document.querySelectorAll('.countdown[data-countdown-target]').forEach(el => {
    const targetDate = new Date(el.dataset.countdownTarget);
    const label      = el.dataset.countdownLabel;

    const tick = () => {
      el.innerHTML = buildCountdownHTML(label, getTimeUntil(targetDate));
    };

    tick();
    setInterval(tick, 1000);
  });
}


/* ============================================================
   INITIALISATION
   ============================================================ */

function init() {
  // Decode all parameters from the single ?c= query param
  const config = parsePageConfig();

  // Extract appointment date (required) and rinse time (optional)
  const appointmentDate = config?.t ? (() => {
    const d = new Date(config.t);
    return isNaN(d.getTime()) ? null : d;
  })() : null;

  const rinseTimeHours = (typeof config?.rinseTime === 'number' && config.rinseTime > 0)
    ? config.rinseTime
    : TIMING.defaultRinseHours;

  // Booking URL — optional, drives the CTA button at the bottom of the guide
  const bookingUrl = (typeof config?.bookingUrl === 'string' && config.bookingUrl.startsWith('http'))
    ? config.bookingUrl
    : null;

  let activeStageId;

  if (appointmentDate) {
    const hoursOffset = getHoursOffset(appointmentDate);
    activeStageId = detectCurrentStage(hoursOffset, rinseTimeHours).id;
  } else {
    // No (or invalid) config — show the generic notice, default to first stage
    const notice = document.getElementById('no-timestamp-notice');
    if (notice) notice.hidden = false;
    activeStageId = STAGES[0].id;
  }

  // Build the page
  renderAppointmentBadge(appointmentDate);
  renderProgressTimeline(activeStageId);
  renderStages(activeStageId, appointmentDate, rinseTimeHours, bookingUrl);

  // Wire up live countdowns
  startCountdowns();

  // Wire up scroll-based timeline highlight
  // Booking CTA sections are excluded — the timeline stays on the last
  // guide step when the user scrolls into the booking card.
  initScrollObserver();

  // Scroll to the active stage after the first paint.
  // rAF commits the layout; the timeout lets CSS transitions settle.
  requestAnimationFrame(() => {
    setTimeout(() => scrollToStage(activeStageId), 350);
  });

  document.body.classList.remove('js-loading');
}

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
