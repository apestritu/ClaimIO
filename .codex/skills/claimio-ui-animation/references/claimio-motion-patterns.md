# ClaimIO Motion Patterns

Use these files as the primary examples for matching ClaimIO's animation style.

## Core references

- `frontend/src/app/globals.css`
  - Source of the app palette, glass utilities, glow utilities, and shared keyframes.
- `frontend/src/components/AgentPhaseAnimation.tsx`
  - Best reference for pulsing agent orbs, status rings, and compact event feed reveals.
- `frontend/src/components/IngestAnimation.tsx`
  - Best reference for staged processing, scan beams, classified document cards, and shelf transitions.
- `frontend/src/components/CoverageAnimation.tsx`
  - Best reference for multi-step narrative motion, orbiting reasoning prompts, and merging facts into a decision.
- `frontend/src/components/CollectAnimation.tsx`
  - Best reference for pipeline storytelling, conveyor progress, and transforming many inputs into one artifact.
- `frontend/src/components/landing/LandingTransition.tsx`
  - Best reference for atmospheric hero motion, expanding rings, particle bursts, and soft text reveal.

## Reusable heuristics

- Start from one icon, orb, card, or artifact at the center.
- Use accent color as both meaning and motion emphasis.
- Let supporting elements arrive in a stagger rather than all at once.
- Use opacity plus scale before reaching for large travel distances.
- Keep the scene readable at a glance even when frozen mid-animation.
- If success or completion matters, end with a stable resting frame.

## App-specific cues

- ClaimIO motion often represents AI work as visible reasoning:
  facts orbit, logs stream, cards merge, confidence appears, checks resolve.
- Surfaces are rarely flat:
  use translucent fills, blur, soft borders, and layered shadows.
- The best animations feel like miniature control-room diagrams, not generic loaders.
