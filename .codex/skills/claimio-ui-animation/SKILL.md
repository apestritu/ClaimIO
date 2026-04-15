---
name: claimio-ui-animation
description: Use this skill when adding or refining animations in the ClaimIO app so new motion matches ClaimIO's existing UI language, Framer Motion patterns, Tailwind styling, and claim-pipeline storytelling.
---

# ClaimIO UI Animation

This is a repo-specific skill for ClaimIO. Use it when the user wants a new animation, wants an existing animation polished, or asks for motion that should feel like the rest of the ClaimIO product.

## Goal

Create animations that feel native to ClaimIO:

- dark, atmospheric surfaces with glass panels and neon OKLCH accents
- motion that explains pipeline state, data flow, or AI reasoning
- one clear focal action with supporting ambient motion
- polished but readable sequences, not generic loading spinners

## Stack

- Frontend: Next.js 15 + React 19
- Motion: `framer-motion`
- Styling: Tailwind 4 plus `frontend/src/app/globals.css`
- Existing animation components live in `frontend/src/components`

## Working Rules

1. Inspect the nearest existing ClaimIO animation before writing new motion.
2. Reuse ClaimIO's palette and surface treatment instead of inventing a new visual system.
3. Make the animation tell a short story about the feature:
   data arrives, gets scanned, reasoned over, validated, approved, handed off, or surfaced.
4. Prefer staged sequences driven by component state and `setTimeout` cleanup for deterministic demos.
5. Keep ambient loops subtle. Reserve the strongest glow, burst, or scale moment for the main event.
6. Favor compact scenes with 1-3 moving ideas over busy canvases full of unrelated motion.
7. Keep text legible while motion is running. The animation should support comprehension, not compete with it.

## ClaimIO Motion Language

### Visual direction

- Use deep dark backgrounds like `oklch(0.145 0.03 256)` and `oklch(0.18 0.025 256)`.
- Use bright accents already established in the app:
  - primary blue: `oklch(0.62 0.19 250)`
  - cyan: `oklch(0.7 0.15 195)`
  - emerald: `oklch(0.7 0.17 160)`
  - amber: `oklch(0.8 0.16 80)`
  - indigo: `oklch(0.55 0.2 270)`
  - destructive rose: `oklch(0.65 0.2 15)`
- Reuse `glass-panel`, glow utilities, gradients, and soft borders from `frontend/src/app/globals.css`.

### Common movement patterns

- Pulse: agent orbs, status indicators, active reasoning nodes
- Scan: vertical beam, sweep line, reveal pass
- Orbit: reasoning prompts, particles, supporting facts around a center object
- Stagger: logs, cards, evidence chips, checklist rows
- Morph/compress: many facts collapsing into one merged artifact
- Burst: approval, activation, handoff, success confirmation

### Preferred pacing

- Entrances: `0.3s` to `0.8s`
- Stage transitions: `1.2s` to `3s`
- Ambient loops: `1.5s` to `3s`, usually infinite
- Large narrative sequences: around `6s` to `12s` total

Use springs for physical reveals and `linear` only for mechanical scans, conveyor belts, or orbital rotation.

## Implementation Pattern

When building a new ClaimIO animation component:

1. Find the closest sibling in `frontend/src/components`.
2. Mirror the existing structure:
   - `"use client"`
   - local state for phases
   - `useEffect` for sequence timing
   - `motion` and `AnimatePresence` for staged reveals
3. Keep the scene modular:
   - one container
   - one focal element
   - supporting chips, cards, particles, or logs
4. If the component participates in the claim pipeline, expose props consistent with nearby components like:
   - `addLog`
   - `onComplete`
   - optional report/output callbacks
5. Clear every timer in cleanup.
6. If a loop is purely decorative, ensure the rest of the scene can stand still without feeling broken.

## What To Avoid

- generic SaaS motion with white cards on flat backgrounds
- random animation styles that ignore ClaimIO's palette
- too many simultaneous glows, rotations, and particle systems
- infinite motion on every element
- huge explanatory text blocks inside the animation
- introducing new libraries when `framer-motion` already covers the need

## Where To Look

Read `references/claimio-motion-patterns.md` for the strongest in-repo examples and what each one is good at copying.

## Output Expectation

When using this skill, produce code that looks like it already belonged in ClaimIO before the request arrived.
