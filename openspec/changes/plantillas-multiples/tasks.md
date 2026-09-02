# Tasks: plantillas-multiples — Work Unit 1 (Typography & Spacing Tokenization)

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | PR 0 ~90-100 · PR 1 ~190 · PR 2 ~105 (Total ~385-395) |
| 400-line budget risk | High (near ceiling if not split; each PR alone is comfortable) |
| Chained PRs recommended | Yes |
| Suggested split | PR 0 (script+baseline) → PR 1 (typography) → PR 2 (spacing) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — orchestrator to confirm before apply |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 0 | Baseline capture + `scripts/css-identity.mjs` | PR 0 | `node scripts/css-identity.mjs <baseline> dist` — empty diff on unchanged tree | N/A — no test/browser runner exists in this repo; `pnpm run build` is the only automated signal | Delete `scripts/css-identity.mjs`; no runtime dependency introduced |
| 1 | 13 `--text-*` tokens, `Title` size contract, typography call-site migration | PR 1 | `pnpm run build` + `node scripts/css-identity.mjs <baseline> dist` | Manual: `/`, `/invitacion` at 360/390/768/1024/1440 (design D6 — no automated browser harness) | Revert call sites; `@theme` block is additive and safe to leave in place |
| 2 | 11 `--spacing-*` tokens, remaining spacing call-site migration | PR 2 | `pnpm run build` + `node scripts/css-identity.mjs <baseline> dist` | Manual: same 5 widths + palette-switch recheck (`palettes.salvia`) | Revert call sites; branches from PR 1, single revert |

## Phase 0: Baseline & Verification Script (PR 0)

- [ ] 0.1 On the merge-base commit: `pnpm run build`, copy `dist` to `$env:TEMP\vi-baseline-dist`, screenshot `/` and `/invitacion` at the 5 widths.
- [ ] 0.2 Create `scripts/css-identity.mjs` (~90 lines, plain `node:fs`, no subprocess): expand `var(--text-*)`/`var(--spacing-*)` against `:root`, normalize whitespace, diff sorted declaration sets between two `dist` paths; fail loudly on a missing/non-directory path — never report an empty diff on error (threat matrix: path arguments).
- [ ] 0.3 Verify: run it against the baseline vs. itself — empty diff.

## Phase 1: Typography Interface (PR 1, commit 1a)

- [ ] 1.1 Add a 13-token `--text-*` block to `@theme` in `src/styles/global.css`: the 11 named tokens plus `--text-title-alt` (`clamp(28px,7vw,40px)`, from `hero.section.astro:38`) and `--text-subtitle-alt` (`clamp(18px,4.6vw,24px)`, from `details.section.astro:110`) — Stage 2 merge candidates (D4). Each value copy-pasted; doc comment records source `file:line`.
- [ ] 1.2 Create `src/types/typography.ts`: `TextToken` (13-member union), `TitleSize = TextToken` (mirrors `src/types/palette.ts`).
- [ ] 1.3 Create `src/lib/typography.ts`: `TITLE_SIZE_CLASS: Record<TitleSize, string>` lookup (mirrors `src/lib/palette.ts`).
- [ ] 1.4 Modify `src/components/Title/title.component.astro`: `fontSize?: string` → `size?: TitleSize`; remove `font-size` from the scoped `<style>` block; keep `define:vars` for `color`/`fontFamily`; apply via `class:list={[TITLE_SIZE_CLASS[size], className]}` (D3).
- [ ] 1.5 Migrate `Title`'s 10 call sites, including `hero.section.astro:38` → `title-alt` and `details.section.astro:110` → `subtitle-alt`.
- [ ] 1.6 Verify: temporarily pass an invalid `size` at one call site, confirm `pnpm run build` fails on that site, then revert.

## Phase 2: Typography Mechanical Migration (PR 1, commit 1b)

- [ ] 2.1 For each of the 13 tokens, run both exact-string searches — `text-[clamp(...)]` (no spaces) and `font-size: clamp(...)` (spaced) — across `calendar`, `countdown`, `polaroid-pair`, `map-modal`, `rsvp-button`, `hero`, `photos`, `details`, and the `index`/`invitacion` pages; replace with the matching utility or `var(--text-*)` (D5 §2).
- [ ] 2.2 On the 6 dual-value lines (`index.astro:75`, `map-modal.component.astro:17`, `hero.section.astro:39,56`, `rsvp-button.component.astro:27,30`), substitute only the typography portion; leave the spacing literal untouched for PR 2.
- [ ] 2.3 Record `token | literal | occurrences replaced` in the PR body; counts must sum to the pre-change typography occurrence count (D5 §3).

## Phase 3: Typography Verification (PR 1)

- [ ] 3.1 Run V1–V4 and V7: build exit 0 with baseline-matching warning set (only `lila`); `css-identity.mjs` empty diff; all 13 tokens and their generated utilities present in `dist/_astro/*.css`; `rg "text-\[clamp|font-size:\s*clamp" src/` hits equal exactly the PR-body deferral manifest.
- [ ] 3.2 Run V9: manual visual check, 5 widths, against the Phase 0 baseline screenshots — no text baseline or block edge moves.
- [ ] 3.3 Add a typography section to `AGENTS.md` at colour-axis depth: the D2 naming rule ("name by the most stable true property"), the token table, the escape-hatch example, and a note on the two provisional Stage-2 tokens.

## Phase 4: Spacing Tokens & Migration (PR 2, branches from PR 1)

- [ ] 4.1 Add an 11-token `--spacing-*` block to `@theme`: 8 ordinal steps (`-3xs`…`-2xl`) plus 3 functionally-named constants — `--spacing-section-gutter`, `--spacing-section-top`, `--spacing-hero-top`. `src/lib/layout.ts` stays unchanged (D1 — this design decision supersedes the spec.md wording "3 named constants in `layout.ts`"; per the design-wins rule, D1's rejection of that option is authoritative).
- [ ] 4.2 Migrate the 5 `section-gutter` sites (`hero`, `photos`, `parents`, `closing`, `date`), then the 4 `info-cube` `-lg` sites, then the remaining single-site tokens (`calendar`, `map-modal`, `details`, `rsvp-button`, `hero`), per the design's cheapest-proof-first order.
- [ ] 4.3 Complete the spacing half of the 6 dual-value lines deferred at task 2.2.
- [ ] 4.4 Record `token | literal | occurrences replaced` in the PR body.

## Phase 5: Spacing Verification (PR 2)

- [ ] 5.1 Run V1–V4 and V8: build; `css-identity.mjs` empty diff; all 11 spacing tokens/utilities present, incl. `.p-2xl{` and `.gap-3xs{`; `rg "(gap|p[xytblr]?|m[xytblr]?)-\[clamp" src/` hits equal the manifest plus the Q1/Q2 geometry exclusions.
- [ ] 5.2 Run V9 and V10: 5-width manual check against baseline; then set `palettes.salvia` in `src/config/invitation.ts`, `pnpm run assets`, rebuild, recheck, revert the palette switch.
- [ ] 5.3 Add a spacing section to `AGENTS.md`: magnitude-rank naming rule, token table, `--spacing-section-*`/`-hero-top` rationale, and the Q1–Q3 geometry-exclusion boundary.

## Phase 6: Follow-up (not blocking PR 1 or PR 2)

- [ ] 6.1 Carry forward the open Stage 2 question (does "visually identical" forbid all pixel change, or only visible change?) — both PRs here are Stage 1 only and ship regardless of its answer.
