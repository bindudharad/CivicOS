# CivicOS V2 "Urban Pulse" Design System Specification

**Design Version:** 2.0.0  
**Design Codename:** Urban Pulse  
**Target Platform:** High-Density Municipal Operations Center & Desktop Command Workstations  
**Viewport Target:** Responsive (1920×1080 Full HD Primary, 1366×768 Laptop, 768×1024 Tablet, 390×844 Mobile)

---

## 1. Design Philosophy & Aesthetic Foundation

"Urban Pulse" is an immersive digital twin command interface designed for municipal incident dispatchers, urban planners, and municipal executives. 

### Core Tenets
1. **Atmospheric Immersion:** Deep midnight layered backgrounds (`#080D1B`, `#101A32`) minimize operator eye fatigue during 24/7 shifts while maximizing contrast for critical telemetry.
2. **Luminous Telemetry:** Cybernetic neon accents (Cyan `#34D9E8`, Electric Blue `#397BFF`, Neon Turquoise `#35E5C5`, Violet `#8B72FF`) draw immediate cognitive focus to active anomalies, risk thresholds, and causal links.
3. **Information Hierarchy:** Distinct separation between global command navigation, high-level operational KPIs, real-time spatial visualizers, and granular tabular records.
4. **Actionable Digital Twin:** 3D urban geometries are not decorative; every building, road, and beacon represents physical infrastructure with direct drill-down capabilities.

---

## 2. Color Palette & Token Specifications

### 2.1 Backgrounds & Spatial Surfaces
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `bg-midnight` | `#080D1B` | Global viewport canvas background |
| `bg-panel` | `#101A32` | Primary cards, panels, and sidebars |
| `bg-elevated` | `#172443` | Hover states, modals, popovers, table headers |
| `bg-input` | `#0E172C` | Input fields, select dropdowns, search boxes |

### 2.2 Borders & Dividers
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Subdued card borders, table dividers |
| `border-accent` | `rgba(52, 217, 232, 0.25)` | Focused cards, active tabs, highlighted nodes |
| `border-glow` | `rgba(57, 123, 255, 0.40)` | Interactive focus states, modal boundaries |

### 2.3 Brand & Operational Accents
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `accent-blue` | `#397BFF` | Primary action buttons, active navigation, graph links |
| `accent-cyan` | `#34D9E8` | Secondary action highlights, KPI badges, 3D beacons |
| `accent-teal` | `#35E5C5` | Sensor pulses, success states, resolution confirmations |
| `accent-violet` | `#8B72FF` | ML predictions, counterfactual simulations, ego graphs |

### 2.4 Incident Severity & Operational Status Scale
| Severity Tier | Range | Color | Glow Token | Status Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Critical (P1)** | 8.0 – 10.0 | `#FF5577` | `0 0 15px rgba(255, 85, 119, 0.5)` | Immediate structural hazard / Emergency dispatch |
| **High (P2)** | 6.0 – 7.9 | `#FF9B55` | `0 0 12px rgba(255, 155, 85, 0.4)` | Severe infrastructure impairment / Urgent crew |
| **Moderate (P3)** | 4.0 – 5.9 | `#F4C76A` | `0 0 10px rgba(244, 199, 106, 0.3)` | Service degradation / Scheduled dispatch |
| **Low (P4)** | 0.1 – 3.9 | `#45D6A1` | `0 0 8px rgba(69, 214, 161, 0.3)` | Minor defect / Routine maintenance |
| **Unassessed** | N/A / null | `#64748B` | None | Triage pending assessment |

---

## 3. Typography & Micro-Hierarchy

CivicOS uses a modern dual-typeface pairing:
* **Interface Body & Headings:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
* **Telemetry & Numeric Values:** `JetBrains Mono`, `Fira Code`, `ui-monospace`, monospace.

### Type Scale
* **Display H1:** `24px` (`1.5rem`), font-weight 700, tracking `-0.025em`.
* **Section Title H2:** `18px` (`1.125rem`), font-weight 600, tracking `-0.02em`.
* **Card Header H3:** `14px` (`0.875rem`), font-weight 600, uppercase, tracking `0.05em`.
* **Body Regular:** `13px` (`0.8125rem`), font-weight 400, line-height 1.5.
* **Metric Value:** `22px` (`1.375rem`), font-family mono, font-weight 700.
* **Badge / Label:** `11px` (`0.6875rem`), font-family mono, font-weight 600, uppercase.

---

## 4. 3D Digital Twin Lighting & Material Standards

The 3D Scene in `LiveMap.tsx` adheres to strict visual rendering parameters:
1. **Illumination Architecture:**
   * **Ambient Light:** Intensity `0.8`, color `#1A2D5A` (deep indigo fill to prevent pitch-black shadows).
   * **Key Directional Light:** Intensity `1.2`, color `#FFFFFF`, positioned at `(80, 140, 80)` with soft cast shadows.
   * **Rim / Accent Light:** Intensity `0.9`, color `#34D9E8` (cyan glow from city horizon).
2. **Procedural Building Materials:**
   * Mesh: Extruded polygon geometries with heights varying between `15` and `90` units.
   * Base Color: Dark slate blue `#13203C` with roughness `0.3` and metalness `0.4`.
   * Edge Shaders: Emissive wireframe edge highlighting with intensity `0.35` (`#2A4D80`).
   * Window Illumination: Dynamic emissive window patterns in warm cyan and white.
3. **Road Arterials:**
   * 2D line network with neon electric blue (`#2050AA`) and pulsing traffic conduits (`#34D9E8`).
4. **Beacons & Hotspots:**
   * DBSCAN Hotspots: Concentric expanding glowing rings (`#FF5577` for critical, `#FF9B55` for high) animated via vertex time uniforms.
   * Incident Markers: Inverted 3D cone pins floating above ground level with vertical pulse animation.

---

## 5. Micro-Interactions & Feedback Patterns

1. **Card Hover Lift:** `translate-y-[-2px]`, transition 200ms ease-out, border transition from `border-subtle` to `border-accent`.
2. **Button Glow & Press:** Active button scale `0.98`, primary buttons emit box-shadow `0 0 15px rgba(57, 123, 255, 0.4)`.
3. **Pulsing Status Dots:** High-urgency indicators utilize CSS `animate-ping` alongside a solid core dot.
4. **Loading States:** Double concentric counter-rotating orbital spinners styled in `#34D9E8` and `#397BFF`.
5. **Toast & Alert Notification:** Slide-in from top-right with colored border strip and backdrop blur `backdrop-blur-md`.
