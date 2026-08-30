---
name: Insight Architecture
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  warning-amber: '#F59E0B'
  border-subtle: '#E2E8F0'
  text-muted: '#64748B'
  surface-card: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The brand personality is authoritative, analytical, and strategically sharp. It operates at the intersection of "Business Strength" and "Digital Opportunity," positioning itself not as a tool that finds failing businesses, but as one that identifies high-potential diamonds in the rough. The emotional response should be one of professional confidence and clarity—reducing the noise of raw data into actionable intelligence.

The design style is **Corporate / Modern** with a focus on **Information Density**. It utilizes a refined palette of deep navies and vibrant accent blues to establish trust and precision. The interface prioritizes clear visual hierarchy through subtle elevations and structured layouts, ensuring that complex lead scoring and technical data remain digestible for high-speed sales workflows.

## Colors

This design system uses a high-contrast professional palette. The primary Deep Navy (#0F172A) is reserved for navigation, primary headings, and grounding elements to establish "Business Strength." The Vibrant Blue (#3B82F6) serves as the primary action color and "Digital Opportunity" indicator.

Functional colors are critical for the lead scoring engine:
- **Success Emerald (#10B981):** Indicates high business quality and healthy reputation signals.
- **Warning Amber (#F59E0B):** Signals digital weaknesses or technical debt where opportunity lies.
- **Neutral Background (#F8FAFC):** Provides a clean, low-strain canvas for dense data tables.
- **Slate Grays:** Used for secondary text and borders to maintain a sophisticated, understated UI.

## Typography

The typography system is built for legibility and technical precision. **Inter** is the primary typeface for its exceptional clarity in data-heavy SaaS environments. It is utilized in a range of weights to create a clear hierarchy between lead names, metrics, and labels.

To emphasize the "Intelligence" aspect of the platform, **JetBrains Mono** is introduced for specific data points, such as Place IDs, technical status codes, and numerical lead scores. This monospaced touch reinforces the data-driven nature of the tool.

- **Headlines:** Use tighter letter-spacing and heavier weights to feel "sturdy" and "established."
- **Data Points:** Use the `data-mono` role for values that require precise comparison across table rows.
- **Labels:** Small-caps are used sparingly for metadata headers to differentiate them from interactive content.

## Layout & Spacing

This design system employs a **Fixed Grid** approach for the dashboard to ensure consistent data alignment, transitioning to a fluid layout for internal content areas. The layout is optimized for high-density information display.

- **Desktop (1280px+):** 12-column grid with 24px gutters. Sidebars are fixed at 280px to maximize the horizontal space for Lead Explorer tables.
- **Tablet (768px - 1279px):** 8-column grid. Sidebars collapse into an icon-only rail or a top-level drawer.
- **Mobile (<767px):** 4-column grid. Data tables reflow into "Lead Cards" to maintain readability.

Spacing follows a strict 4px/8px baseline shift. Use `stack-sm` for related elements (e.g., a lead name and its category) and `stack-lg` for distinct sections in the Lead Detail view.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Low-Contrast Outlines**. Instead of heavy shadows, the system uses "Surface Tiers" to indicate depth.

1.  **Level 0 (Base):** The neutral background (#F8FAFC).
2.  **Level 1 (Card):** White surfaces (#FFFFFF) with a subtle 1px border (#E2E8F0).
3.  **Level 2 (Dropdowns/Modals):** White surfaces with a soft, diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.08)).

This approach keeps the interface feeling "flat" and professional, preventing "shadow fatigue" in data-heavy screens while still providing enough depth to distinguish actionable items from static background information.

## Shapes

The shape language is "Soft" (0.25rem), reflecting a disciplined and industrial aesthetic. 

- **Standard Elements:** Buttons, inputs, and small cards use a 4px (0.25rem) radius.
- **Interactive Containers:** Larger lead detail sections or modals may use `rounded-lg` (8px) for a slightly more approachable feel.
- **Status Pills:** Badges for "Qualified" or "Interested" use a full pill-shape to distinguish them from interactive buttons.

This subtle rounding balances the sharpness of the data tables, making the platform feel modern without losing its "Business Strength" professional edge.

## Components

### Buttons & Inputs
Buttons utilize solid fills for primary actions (Deep Navy) and subtle borders for secondary actions. Input fields use a clear 1px border that shifts to Vibrant Blue on focus, emphasizing the "active" search state.

### Lead Scoring Badges
The core component of the system. The 0-100 score is displayed in a circular or heavy-weight square format. 
- **High Opportunity (80-100):** Vibrant Blue text with a light blue background tint.
- **Business Strength (70+):** Success Emerald indicator dots.
- **Digital Opportunity (70+):** Warning Amber indicator dots.

### High-Density Data Tables
Tables are the workhorse of the Lead Explorer. They use a horizontal-border-only style to keep the focus on row scanning. Hover states should highlight the entire row in a very light gray (#F1F5F9).

### Status Indicators
CRM states (New, Contacted, Won) use small colored dots paired with `label-caps` typography. This prevents the UI from becoming overwhelmed by too many large colorful buttons.

### Search Filters
Filters are grouped at the top of the Lead Explorer in a "Filter Bar" using segmented controls or compact dropdowns. This allows the user to quickly narrow down by "Category" or "Score Range" without leaving the main view.