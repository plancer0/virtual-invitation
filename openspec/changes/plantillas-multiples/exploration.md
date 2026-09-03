# Exploration — plantillas-multiples

Multiple invitation templates: shared library, per-client repos.

- **Change**: `plantillas-multiples`
- **Phase**: explore
- **Artifact store**: hybrid (mirror of Engram topic `sdd/plantillas-multiples/explore`)
- **Branch at exploration time**: `refactor/atomizacion`

## Goal

Support two distinct tiers of invitation template:

- **Tier A — configuration only.** Reuses an existing layout; only palette, texts, and
  photos change. Creation should be near-fully automated.
- **Tier B — fully custom layout.** A genuinely different arrangement of sections,
  still reusing shared components, decorations, and design tokens.

User constraint: a single repository must not become bloated as templates accumulate.

## Current state

The site is already configuration-driven for exactly one invitation.

- `src/config/invitation.ts` holds a single `InvitationConfig` (name, palette, parents,
  date, texts, venue, dress code, RSVP, four typed `ImageMetadata` photos). This is
  already "one config file plus a photos folder" in shape; what is missing is a registry
  for a second instance.
- `src/pages/invitacion.astro` hardcodes the section composition (Hero, Photos, Parents,
  Date, Details, Closing) inside nested `Frame` components. **This file is the layout**,
  so Tier B needs its own version of it per template shape.
- `pnpm-workspace.yaml` exists but declares only `allowBuilds`. There is no `packages:`
  field, so this is not yet a workspace monorepo.

### Design-token maturity

One axis is systematized; two are not.

| Axis | State |
| --- | --- |
| Colour | Complete: 6 named palettes, resolver with WCAG contrast checks that warn at build, 9 CSS custom properties injected on `<html>` |
| Typography | Only the 3 font families are tokens. 18 distinct hardcoded `clamp()` sizes |
| Spacing | Not tokenized. 27 distinct hardcoded `clamp()` values |

114 `clamp()` occurrences in total across `src/`, spread over both pages, `src/lib/layout.ts`,
and 13 component files.

`src/components/Title/title.component.astro` declares `fontSize?: string` defaulting to the
raw literal `"40px"`. The prop accepts any CSS string, so it cannot be wrong — a plausible
mechanism for how near-duplicate values accumulated (`clamp(13px,3.6vw,16px)`, `...,17px)`,
`...,18px)`).

### Weight distribution

| Thing | Size |
| --- | --- |
| All application code | ~160 KB |
| Decorations referenced by code | ~1.1 MB |
| Client photos, per invitation | ~900 KB |
| Image files referenced by nothing | ~36 MB |
| `.git` history | 69 MB |

Extracting a component library moves only ~160 KB. **Weight is not the argument for
extraction; propagation of fixes is.**

## Gating technical questions

Resolved from documentation and changelog evidence. None were proved by a proof of concept
in this repository.

| # | Question | Status |
| --- | --- | --- |
| 1 | Does `astro:assets` optimize images imported from a workspace package? | **Partial.** `withastro/astro#14937` / `#14957` document a narrow dev-only 500 on `/_image` when an asset path is reached through a symlink placed inside `src/`. Production builds are unaffected. The published-dependency configuration was not tested |
| 2 | Does Tailwind 4 `@source` scan a package across pnpm symlinks? | **Confirmed by evidence.** `tailwindlabs/tailwindcss#16038` / `#16765` fixed by PR `#17391` (merged 2025-03-26), which adds explicit symlink resolution. Installed 4.3.3 post-dates that merge |
| 3 | Does `import.meta.glob` work across a package boundary? | **Confirmed problematic.** Vite intentionally ignores glob targets resolving into `node_modules` (`vitejs/vite#2390`, `#5728`). `src/lib/assets.ts` must change shape |
| 4 | Do `.astro` components keep scoped styles and `define:vars` when consumed from a package? | **Confirmed by docs.** Astro's publishing guide states `.astro` files ship and are consumed with no build step; the compiler resolves scoping at the point of consumption |

## Options considered

| # | Option | Tier A | Tier B | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Single monorepo holding real client invitations | Easy | Easy | Rejected. Violates the no-bloat constraint and pools every client's private photos into one git history |
| 2 | Published shared package plus separate per-client repos | Config + photos | Own composition, shared library | Viable. Solves fix propagation; makes questions 1 and 3 real |
| 3 | Template repo copied per invitation, no runtime dependency | Copy and edit | Copy and edit | Rejected alone. Zero risk, but no fix propagation — the burden the user wants automated |
| 4 | Content collections, one app renders N invitations | Easy | Not supported | Rejected for delivery. Pools all client data into one repo and one deploy. Acceptable only for a demo gallery |
| 5 | **Hybrid of 2 and 3** | Scaffold from starter | New starter shape in the library | **Recommended** |

## Recommendation

A small shared library (components, decoration sources plus recolor scripts, palette engine,
and future typography/spacing tokens) consumed by independently created, scaffold-generated
per-client repositories.

Tier B *shapes* live as starter folders inside the library repository — bounded growth, one
folder per template shape, never one per client. Every real client repository is scaffolded
from a starter and is never merged back.

This is the only option that satisfies both tiers and the no-bloat constraint, and it targets
the real cost — fix propagation — rather than the ~160 KB of code weight.

### Sequencing

Tokenize typography and spacing **before** the library is extracted, but not before all
`plantillas-multiples` work: Tier A never touches layout, and the current site is fine as it
stands.

The rationale is that extraction's entire value is "fix once, propagate everywhere".
Publishing v1 with 114 uncoordinated `clamp()` values and a `fontSize: string` prop that
cannot be wrong guarantees a second propagation cycle the moment someone notices. The colour
system already proves the token-plus-resolver pattern works in this codebase.

### Dead assets and git history

Leave both untouched here. The recommended architecture makes the problem moot: new client
repositories start with no history baggage, and the eventual safe place to prune the 36 MB is
the library repository, which will never hold client photos.

## Risks

- All four gating questions rest on documentation and changelog evidence, not an empirical
  proof of concept. A time-boxed spike — one component and one decoration through a real
  workspace boundary, then `pnpm build` — should precede full extraction.
- `src/lib/assets.ts`'s glob resolver needs redesign for any cross-package shape: either keep
  the recolor glob local to each consumer and ship only source assets plus scripts, or have
  the library export a static manifest.
- Typography and spacing tokenization touches 13+ components and both pages, against a hard
  requirement that the existing invitation stay visually identical.
- No test runner, linter, or type-checker exists. `pnpm run build` is the only automated
  correctness signal.
- The distribution mechanism (npm, GitHub Packages, or a git dependency) is not yet selected
  or verified.

## Work units for the proposal

1. Typography and spacing tokenization — prerequisite, contained to `src/`.
2. Library extraction plus the first Tier A and Tier B starter scaffolds — should follow the
   spike.
