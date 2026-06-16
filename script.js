/* ============================================================
   Tan'n'go Treatment Guide — Script
   All timeline logic, rendering, countdowns, and scroll UX
   ============================================================ */

'use strict';

/* ── Stage Configuration ────────────────────────────────────
   Each stage has:
     id            – unique identifier
     startsAtHours – hours relative to appointment when this stage begins
                     (negative = before, positive = after)
     label         – short display name used in the timeline nav
     title         – card heading (placeholder)
     subtitle      – card subheading (placeholder)
     icon          – emoji icon for the card
     isAppointment – marks the appointment node in the timeline
     countdown     – optional countdown config { target, label }
                     target: 'appointment' | 'firstRinse'
     checklist     – array of placeholder strings
     image         – include image placeholder if truthy
     notes         – placeholder tip text
   ──────────────────────────────────────────────────────── */
const STAGES = [
  {
    id: 'early',
    startsAtHours: -9999,
    label: '14+ Days',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#127807;',
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: '7days',
    startsAtHours: -168,   // 7 days = 168 hours before
    label: '7 Days',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#10024;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: true,
    notes: 'Notes placeholder',
  },
  {
    id: '48hours',
    startsAtHours: -48,    // 48 hours before
    label: '48 Hours',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#128703;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: '24hours',
    startsAtHours: -24,    // 24 hours before
    label: '24 Hours',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#128167;',
    countdown: { target: 'appointment', label: 'Until your appointment' },
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: 'appointmentDay',
    startsAtHours: -6,     // same-day final prep (6 hours before)
    label: 'Appt. Day',
    title: 'Title placeholder',
    subtitle: 'Subtitle placeholder',
    icon: '&#128197;',
    countdown: { target: 'appointment', label: 'Until your treatment' },
    checklist: [
      'Checklist item placeholder',
      'Checklist item placeholder',
      'Checklist item placeholder',
    ],
    image: false,
    notes: 'Notes placeholder',
  },
  {
    id: 'treatment',
    startsAtHours: 0,      // appointment time
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
    startsAtHours: 1,      // 1 hour after (treatment complete, tan developing)
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
    startsAtHours: 8,      // 8 hours after appointment
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
    startsAtHours: 24,     // 1 day after
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
    startsAtHours: 168,    // 7 days after
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
];

/* ── Timing Configuration ───────────────────────────────────
   Adjust these offsets (hours relative to appointment) to match
   the actual treatment protocol without touching the rest of the code.
   ──────────────────────────────────────────────────────── */
const TIMING = {
  treatmentDurationHours: 1,   // length of the treatment itself
  firstRinseHours: 8,          // hours after appointment for first rinse
};


/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Parse the appointment timestamp from the URL query parameter `?t=`.
 * Accepts ISO 8601 format: 2026-06-20T17:00:00
 * @returns {Date|null}
 */
function parseAppointmentTimestamp() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('t');
    if (!raw) return null;

    const date = new Date(raw);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}

/**
 * Return the current time offset in hours from the appointment.
 * Negative = before appointment, positive = after.
 * @param {Date} appointmentDate
 * @returns {number}
 */
function getHoursOffset(appointmentDate) {
  return (Date.now() - appointmentDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Determine which stage is currently active based on the hours offset.
 * The active stage is the last one whose `startsAtHours` <= hoursOffset.
 * @param {number} hoursOffset
 * @returns {object} stage config object
 */
function detectCurrentStage(hoursOffset) {
  let active = STAGES[0];
  for (const stage of STAGES) {
    if (hoursOffset >= stage.startsAtHours) {
      active = stage;
    } else {
      break;
    }
  }
  return active;
}

/**
 * Return the status of a stage relative to the active stage.
 * @param {string} stageId
 * @param {string} activeStageId
 * @returns {'past'|'current'|'future'}
 */
function getStageStatus(stageId, activeStageId) {
  const stageIdx  = STAGES.findIndex(s => s.id === stageId);
  const activeIdx = STAGES.findIndex(s => s.id === activeStageId);
  if (stageIdx < activeIdx)  return 'past';
  if (stageIdx === activeIdx) return 'current';
  return 'future';
}

/**
 * Format a Date for display in the header badge.
 * @param {Date} date
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
 * @param {Date} targetDate
 * @returns {{days:number, hours:number, minutes:number, seconds:number}|null}
 *          null if the target is in the past
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
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Resolve the target Date object for a countdown config.
 * @param {{target: string, label: string}} countdownCfg
 * @param {Date} appointmentDate
 * @returns {Date}
 */
function resolveCountdownTarget(countdownCfg, appointmentDate) {
  if (countdownCfg.target === 'firstRinse') {
    return new Date(appointmentDate.getTime() + TIMING.firstRinseHours * 3600 * 1000);
  }
  // Default: countdown to appointment
  return appointmentDate;
}

/**
 * Build the inner HTML string for a countdown element.
 * @param {string} label
 * @param {{days,hours,minutes,seconds}|null} timeObj
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
 * Render the full progress timeline into the nav.
 * @param {string} activeStageId
 */
function renderProgressTimeline(activeStageId) {
  const container = document.getElementById('progress-timeline-inner');
  const activeIdx = STAGES.findIndex(s => s.id === activeStageId);
  const progressPct = STAGES.length > 1
    ? (activeIdx / (STAGES.length - 1)) * 100
    : 0;

  // Build track + nodes
  const nodesHTML = STAGES.map((stage, idx) => {
    let statusClass = 'is-future';
    if (idx < activeIdx)  statusClass = 'is-past';
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
 * @param {string} visibleStageId  – the stage currently centred in the viewport
 */
function updateTimelineActive(visibleStageId) {
  const nodes     = document.querySelectorAll('.timeline-node');
  const activeIdx = STAGES.findIndex(s => s.id === visibleStageId);

  nodes.forEach((node, idx) => {
    node.classList.remove('is-past', 'is-active', 'is-future');
    node.setAttribute('aria-current', 'false');

    if (idx < activeIdx)  { node.classList.add('is-past');   return; }
    if (idx === activeIdx) {
      node.classList.add('is-active');
      node.setAttribute('aria-current', 'step');
      return;
    }
    node.classList.add('is-future');
  });

  // Animate the track fill
  const fill = document.querySelector('.timeline-track__fill');
  if (fill && STAGES.length > 1) {
    fill.style.width = `${(activeIdx / (STAGES.length - 1)) * 100}%`;
  }

  // Scroll the timeline so the active node is centred
  const activeNode = document.querySelector(`.timeline-node[data-stage-id="${visibleStageId}"]`);
  if (activeNode) {
    activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

/**
 * Build a checklist item element.
 * @param {string} text
 * @returns {string} HTML string
 */
function buildChecklistItemHTML(text) {
  // SVG checkmark (shown when stage is past via CSS)
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
 * @param {string}    activeStageId
 * @param {Date|null} appointmentDate
 */
function renderStages(activeStageId, appointmentDate) {
  const container = document.getElementById('stages-container');

  STAGES.forEach((stage, idx) => {
    const status = getStageStatus(stage.id, activeStageId);

    // Status badge
    const badgeLabel = { current: 'Current Step', past: 'Completed', future: 'Upcoming' }[status];
    const badgeClass = `stage-badge--${status}`;

    // Countdown HTML (only when timestamp is available)
    let countdownHTML = '';
    if (stage.countdown && appointmentDate) {
      const targetDate = resolveCountdownTarget(stage.countdown, appointmentDate);
      const timeObj    = getTimeUntil(targetDate);
      countdownHTML = `
        <div class="countdown"
             data-countdown-target="${targetDate.toISOString()}"
             data-countdown-label="${stage.countdown.label}">
          ${buildCountdownHTML(stage.countdown.label, timeObj)}
        </div>
      `;
    }

    // Checklist HTML
    const checklistHTML = stage.checklist && stage.checklist.length
      ? `<div>
          <p class="sub-label">Checklist</p>
          <ul class="checklist">
            ${stage.checklist.map(buildChecklistItemHTML).join('')}
          </ul>
        </div>`
      : '';

    // Image placeholder HTML
    const imageHTML = stage.image
      ? `<div class="img-placeholder">
          <span class="img-placeholder__icon" aria-hidden="true">&#128444;</span>
          <span>Image placeholder</span>
        </div>`
      : '';

    // Notes HTML
    const notesHTML = stage.notes
      ? `<div class="stage-notes">
          <p class="sub-label">Tip</p>
          <p>${stage.notes}</p>
        </div>`
      : '';

    // Build full section
    const section = document.createElement('section');
    section.id        = `stage-${stage.id}`;
    section.className = `stage-section is-${status}`;
    section.setAttribute('aria-label', stage.label);
    // Stagger entrance animation
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
 * The observer uses a narrow root margin (centre band of the viewport)
 * so the timeline reflects whichever card is most prominently visible.
 */
function initScrollObserver() {
  const sections = document.querySelectorAll('.stage-section');
  if (!sections.length) return;

  // Track the latest intersection time per section so we can pick the
  // most-recently-intersected one when multiple fire simultaneously.
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

      // Choose the stage that became visible most recently
      let latestId   = null;
      let latestTime = -Infinity;
      intersecting.forEach((time, id) => {
        if (time > latestTime) {
          latestTime = time;
          latestId   = id;
        }
      });

      if (latestId) updateTimelineActive(latestId);
    },
    {
      // Only observe the middle third of the viewport
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
 * Find all countdown elements and start a 1-second interval for each.
 * Each countdown reads its target from `data-countdown-target` (ISO string)
 * and its label from `data-countdown-label`.
 */
function startCountdowns() {
  const countdownEls = document.querySelectorAll('.countdown[data-countdown-target]');

  countdownEls.forEach(el => {
    const targetDate = new Date(el.dataset.countdownTarget);
    const label      = el.dataset.countdownLabel;

    function tick() {
      el.innerHTML = buildCountdownHTML(label, getTimeUntil(targetDate));
    }

    // Initial render, then every second
    tick();
    setInterval(tick, 1000);
  });
}


/* ============================================================
   INITIALISATION
   ============================================================ */

function init() {
  const appointmentDate = parseAppointmentTimestamp();

  let activeStageId;

  if (appointmentDate) {
    const hoursOffset = getHoursOffset(appointmentDate);
    activeStageId = detectCurrentStage(hoursOffset).id;
  } else {
    // No (or invalid) timestamp — show notice, default to first stage
    const notice = document.getElementById('no-timestamp-notice');
    if (notice) notice.hidden = false;
    activeStageId = STAGES[0].id;
  }

  // Build the page
  renderAppointmentBadge(appointmentDate);
  renderProgressTimeline(activeStageId);
  renderStages(activeStageId, appointmentDate);

  // Wire up live countdowns
  startCountdowns();

  // Wire up scroll-based timeline updates
  initScrollObserver();

  // Scroll to the active stage after the first paint.
  // rAF ensures the layout is committed before we attempt to scroll.
  requestAnimationFrame(() => {
    // Small delay lets CSS transitions settle, preventing a jarring jump
    setTimeout(() => scrollToStage(activeStageId), 350);
  });

  // Lift loading class so animations begin
  document.body.classList.remove('js-loading');
}

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
