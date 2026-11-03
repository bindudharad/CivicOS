# CivicOS Next-Generation 3D Command Center — Design System Documentation

## 1. Overview & Vision
The CivicOS Next-Generation Design System translates the core mission of municipal urban intelligence into an immersive, high-contrast, distraction-free command environment. Unlike generic SaaS dashboards or template-driven administrative consoles, CivicOS draws design inspiration from orbital telemetry centers, mission control rooms, and interactive geospatial twins.

Key Design Principles:
1. **Information Density with Absolute Clarity**: Large data grids, visual gauges, and network topologies are framed with crisp hierarchy so operators can scan 125+ city incidents in seconds.
2. **Deterministic Color Semantics**: Color is never decorative. Every hue indicates an operational state, spatial cluster, or severity tier.
3. **Immersive Spatial Context**: Three.js WebGL rendering provides true 3D spatial awareness for Bengaluru's urban grid without compromising accessibility or responsiveness.
4. **Low Eye Fatigue**: Deep blue-tinted dark surfaces (`#07111F`, `#0A1625`) ensure comfortable continuous 24/7 monitoring.

---

## 2. Design Tokens & Palette

### Background & Surface Hierarchy
```css
--bg-main: #07111F;             /* Deepest void space / canvas base */
--bg-secondary: #0A1625;        /* Sidebar navigation, top header */
--bg-elevated: #101F30;         /* Card background, dialog overlays */
--surface-card: #102235;        /* Primary operational panels */
--surface-elevated: #142A3D;    /* Interactive elements, input fields */
--surface-interactive: #193249; /* Hover states, active selections */
```

### Borders & Dividers
```css
--border-standard: #243B50;     /* Primary card and component boundaries */
--border-subtle: #1B3043;       /* Table row dividers, subtle gutters */
```

### Typography & Text Tokens
```css
--text-primary: #F0F6FC;   /* Headings, primary metrics, high-emphasis values */
--text-secondary: #A4B5C7; /* Subheaders, field labels, descriptive prose */
--text-muted: #73889D;     /* Captions, timestamps, disabled indicators */
```

### Brand Accents & Telemetry Glows
```css
--accent-cyan: #36D6CC;       /* Primary interactive accent, live telemetry glow */
--accent-deep-cyan: #16A6B3;  /* Button hover states, active indicators */
--accent-blue: #5B9EFF;       /* Secondary metrics, model features */
--accent-purple: #8B5CF6;     /* ML estimators, algorithm nodes */
```

### Status & Severity Tiers
| Tier / Level | Color Token | Hex Code | Semantic Application |
|---|---|---|---|
| Critical / P1 | `--status-critical` | `#FF5364` | Severity 8–10, infrastructure failure, P1 dispatch |
| High / P2 | `--status-high` | `#FF9955` | Severity 6–7, cascading alerts, active incident |
| Medium / P3 | `--status-medium` | `#F3C767` | Severity 4–5, warning indicators, in-progress tasks |
| Low / P4 | `--status-low` | `#46C99A` | Severity 1–3, verified resolutions, operational normal |
| Telemetry Active | `--status-info` | `#5B9EFF` | Informational status, network edges |

---

## 3. Typography Scale & Hierarchy

- **Font Families**:
  - UI Sans: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Code / Telemetry Mono: `'JetBrains Mono', 'Fira Code', monospace`
- **Scale**:
  - Display Hero: 32px / 36px line-height, 900 weight (`tracking-tight`)
  - Page Title: 20px / 24px line-height, 700 weight
  - Card Header / Section: 14px / 18px line-height, 600 weight
  - Body Text: 14px / 20px line-height, 400 weight
  - Captions & Microcopy: 11px / 14px line-height, 500 weight (`tracking-wider`, uppercase)
  - Data / Coordinates: 12px / 16px, JetBrains Mono font

---

## 4. Component Library Architecture

### Button Variants
1. **Primary Button**: Filled `--accent-cyan` background with `#07111F` bold text. Subtle cyan glow on focus/hover.
2. **Secondary Button**: Bordered `--border-standard` with `--surface-interactive` background.
3. **Danger Button**: Subtle red tint with high-contrast critical border for destructive actions.
4. **Ghost / Icon Button**: Minimal footprint, used for controls and compact toolbars.

### Cards & Telemetry Containers
- Double-border elevation using standard tokens and border radius `12px` (`0.75rem`).
- Glassmorphism effects with `backdrop-filter: blur(12px)` and translucent backgrounds (`rgba(16, 34, 53, 0.7)`).
- Hover transitions: 200ms cubic bezier elevation.

### Data Displays & KPIs
- Top metric value in 24px bold font colored by metric state.
- Icon badge with matched background tint (10% opacity) and border (20% opacity).
- Trend badge supporting positive and negative delta chips.
