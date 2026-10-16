---
name: Monochrome Workspace
description: A quiet, precise workspace with white surfaces, black interaction states and content-led hierarchy.
colors:
  primary: "#17191c"
  background: "#ffffff"
  stage: "#f5f6f8"
  border: "#e1e4e8"
  secondary: "#626873"
  control: "#858d98"
  controlBorder: "#c7ccd3"
  hover: "#f1f3f5"
  primaryHover: "#34383e"
  danger: "#b3261e"
  errorBackground: "#fff1f0"
typography:
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  metadata:
    fontSize: 12px
    lineHeight: 1.5
  section:
    fontSize: 16px
    fontWeight: 600
  title:
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px
rounded:
  control: 6px
  field: 5px
  stage: 4px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
components:
  primaryButton:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: 8px 12px
    height: 36px
  field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    rounded: "{rounded.field}"
    padding: 9px 10px
  stage:
    backgroundColor: "{colors.stage}"
    rounded: "{rounded.stage}"
    padding: "{spacing.xl}"
---

# Monochrome Workspace

## Overview

**Creative North Star: "Room for the work"**

A quiet editing environment: the work supplies expression, the interface supplies clarity. White panels, fine neutral dividers, near-black text, black selection and an unmistakable primary action. No blue accent. Use this system for workspaces, inspectors, dashboards and editors; adapt the arrangement to the task rather than forcing a video timeline onto every product.

The reference composition has a restrained header, compact navigation/list, dominant central work area and contextual inspector. Keep advanced controls behind labeled disclosure. Preserve draft fields when changing tabs. Save, history, validation and progress must remain truthful application behavior.

**Key Characteristics:**
- White surfaces and black interaction states
- Compact system typography and fine dividers
- Visible keyboard focus and contextual controls

## Colors

White (#ffffff) is the main surface; #f5f6f8 separates the central stage. Primary text, selection, primary actions and focus use #17191c. Secondary text uses #626873. Structural dividers use #e1e4e8; field boundaries use #858d98 and secondary-button borders #c7ccd3. Hover surfaces use #f1f3f5, primary hover #34383e. Red #b3261e and pale red #fff1f0 are reserved for destructive actions and errors. Color is never the sole state cue: selection, labels and aria state agree.

### Primary
- **Ink** (#17191c): Text, primary actions, focus and selected rows.
- **Ink hover** (#34383e): Primary action hover.

### Neutral
- **White** (#ffffff): Panels and control backgrounds.
- **Stage** (#f5f6f8): Central work area and summaries.
- **Divider** (#e1e4e8): Structural boundaries.
- **Secondary text** (#626873): Readable supporting information.
- **Control edge** (#858d98): Input boundaries.
- **Button edge** (#c7ccd3): Secondary action border.
- **Hover** (#f1f3f5): Quiet control hover.

### Feedback
- **Danger** (#b3261e): Errors and destructive actions.
- **Error surface** (#fff1f0): Inline error background.

## Typography

**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
**Label/Mono Font:** ui-monospace, SFMono-Regular, monospace (technical values only)

**Character:** Compact and familiar, with hierarchy supplied by weight and space.

### Hierarchy
- **Title** (600, 20px, 1.3): Project title; -0.4px tracking.
- **Headline** (600, 16px, 1.5): Section title.
- **Body** (400, 13px, 1.5): Desktop content and controls.
- **Label** (400, 12px, 1.5): Desktop supporting metadata.


Use the platform system sans stack, not a downloaded font. Desktop body/controls 13px, metadata 12px, section headings 16px/600, project title 20px/600 with -0.4px tracking. Body line height 1.5, explanatory paragraphs 1.6, title 1.3. Monospace is restricted to technical values such as time/path data. At 850px and below, body and controls become at least 14px; text fields use 16px to avoid mobile focus zoom.

## Elevation

No decorative shadows, gradients, glass or floating cards. Separate regions with 1px dividers, space and the neutral stage surface. Corners are 6px on buttons, 5px on fields and summaries, 4px on the stage. Use 4/8/12/16/24/32px spacing. Desktop header is at least 68px; the reference grid is 224px / flexible / 320px. Panels scroll independently only when viewport height is bounded. At 850px the inspector moves below; at 540px the work area comes first in one column. Every region remains reachable through labeled section links.

## Components

### Actions

Primary action is black/white, 600 weight. Secondary action is white with a neutral border; quiet action removes the border. Minimum height 36px desktop, 44px touch. All controls have visible labels or accessible names. Disabled controls are visibly unavailable; destructive actions retain an explicit label and use red sparingly.

### Fields

Labeled inputs and resizable textareas have a readable neutral boundary and 9px 10px padding. Never replace labels with placeholders. Validation sits beside the affected control, sets aria-invalid and links its explanation. All focusable controls receive a 2px black outline with 3px offset. Do not suppress browser semantics.

### List selection

Compact full-width rows show a muted index and concise content. Selected row is black/white with aria-current or aria-selected appropriate to its widget. A list of ordinary buttons stays ordinary buttons; only use listbox semantics when implementing its full keyboard contract.

### Inspector tabs

Text tabs use a 2px black underline and 20px gap. Implement roving tab focus, Left/Right, Home/End, aria-selected and linked tabpanels. Hide inactive panels without unmounting pending forms. Keep dirty/invalid information accessible outside hidden panels when necessary.

### Disclosure and feedback

Use native details/summary for advanced options, divided from the main fields. Status text is small and quiet; live updates use a polite status region. Errors are explicit and announced. Progress, Save, Undo and Export must reflect the host application; the specimen is not an editing engine.

## Do's and Don'ts

### Do

- Let content dominate and preserve the host application's workflows and data contracts.
- Use scoped styles, the supplied tokens, accessible native controls and visible focus.
- Reflow at narrow widths, provide 44px touch targets, and honor reduced motion.
- Test real editing, errors, pending drafts and keyboard navigation after adoption.

### Don't

- Add blue accents, decorative shadows, gradients, ornamental panels or display fonts.
- Hide supported capabilities merely to make the screen look simpler.
- Treat the specimen's sample interactions as production save/history/export logic.
- Apply workspace colors to authored media or force every project into a three-column layout.
