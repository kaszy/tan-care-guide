Build a single-page static website for a premium spray tanning salon called **Tan'n'go**.

This is NOT a marketing landing page and NOT an ecommerce page.

The purpose is to act as a **smart treatment guide** that clients open before and after their spray tan appointment.

The site must work entirely as a static website (HTML, CSS, JavaScript only). No backend, no database, no frameworks required. Vanilla JavaScript is preferred unless a framework provides a significant advantage.

# Concept

Clients receive a link containing their appointment timestamp:

```
https://treatment.tanngo.pl?t=2026-06-20T17:00:00
```

The page reads the timestamp from the URL and dynamically adjusts the experience based on the current time relative to the appointment.

The appointment timestamp is the center of the entire timeline.

The guide begins BEFORE the treatment and continues AFTER the treatment.

The website should always answer:

> "What should I be doing right now?"

while still allowing access to all instructions.

# Brand Identity

Industry: beauty / spray tanning

Tone:

* premium
* feminine
* elegant
* modern
* reassuring
* professional

Avoid:

* aggressive sales language
* flashy animations
* bright neon colors
* "tech startup" aesthetics

Visual inspiration:

* luxury beauty brands
* skincare brands
* boutique salons

Color palette:

* soft lavender
* light purple accents
* white
* very light grey
* subtle gradients

Typography:

* elegant serif for headings
* clean sans-serif for body text

Visual style:

* soft shadows
* rounded corners
* generous whitespace
* smooth transitions
* mobile-first

# Technical Requirements

## URL Timestamp

Read timestamp from query parameter:

```js
?t=2026-06-20T17:00:00
```

Create utility functions for:

* appointment date parsing
* current date calculation
* time difference calculations
* stage detection

Handle invalid timestamps gracefully.

If timestamp is missing:

* display generic version of the guide
* default to first section

# Timeline Logic

Create configurable stages.

Use a configuration object so content can be modified later.

Example structure:

```js
const stages = [
  {
    id: "14days",
    startsAtHours: -336
  },
  {
    id: "7days",
    startsAtHours: -168
  }
];
```

The actual content should be placeholders.

Only implement the logic.

Possible stages:

* 14+ days before
* 7 days before
* 48 hours before
* 24 hours before
* appointment day
* treatment in progress
* development period
* first rinse
* aftercare
* fading phase

Determine which stage is currently active.

# Dynamic Focus

All sections must remain visible.

Do NOT hide future sections.

Instead:

Current stage:

* visually emphasized
* highlighted border
* larger shadow
* "Current Step" badge

Past stages:

* marked as completed

Future stages:

* visually subdued

# Automatic Navigation

On page load:

1. Detect current stage
2. Smoothly scroll to the active section
3. Center active section in viewport

Use smooth scrolling.

Do not perform aggressive scroll locking.

# Scroll Experience

Use CSS scroll snapping.

Important:

Use:

```css
scroll-snap-type: y proximity;
```

NOT mandatory snapping.

Each major stage should feel like a card or chapter.

The user should always be free to scroll naturally.

# Progress Visualization

Create a sticky progress component.

Desktop:

* horizontal timeline

Mobile:

* compact sticky timeline

The appointment itself should be visually central.

Example concept:

Preparation → Appointment → Development → Aftercare

The active stage should update while scrolling.

Use IntersectionObserver.

# Countdown Components

Create reusable countdown modules.

Examples:

* time until appointment
* time until first rinse

Countdowns should update automatically.

Use placeholders for values.

# Section Structure

Create reusable section cards.

Each section should support:

* title
* subtitle
* icon placeholder
* image placeholder
* checklist placeholder
* notes placeholder

Content should be easy to edit later.

# Animations

Use subtle animations only.

Examples:

* fade in
* slight translate
* progress updates

Avoid:

* parallax
* excessive motion
* scroll hijacking

Respect prefers-reduced-motion.

# File Structure

Generate:

```
index.html
styles.css
script.js
```

Keep code clean and documented.

# Content Placeholders

Do NOT write actual tanning instructions.

Use placeholders like:

"Instruction placeholder"

"Checklist item"

"Image placeholder"

The goal is to create a fully functioning technical skeleton with all timeline logic implemented.

# Deliverables

Generate complete code for:

* index.html
* styles.css
* script.js

The page should be immediately usable after replacing placeholder text and images.

Focus on architecture, maintainability, user experience, timeline logic, URL timestamp handling, scroll behavior, progress tracking, and responsive design.
