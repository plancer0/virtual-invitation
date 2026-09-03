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

- [~] 0.1 On the merge-base commit: `pnpm run build`, copy `dist` to `$env:TEMP\vi-baseline-dist`, screenshot `/` and `/invitacion` at the 5 widths. **Partial**: build + copy to `/c/Users/MSI/AppData/Local/Temp/vi-baseline-dist` done by sdd-apply (no PowerShell available in-session, used the Bash-equivalent path). Screenshots NOT taken by sdd-apply (no browser tool available) — orchestrator to capture the visual baseline separately.
- [x] 0.2 Create `scripts/css-identity.mjs` (~90 lines, plain `node:fs`, no subprocess): expand `var(--text-*)`/`var(--spacing-*)` against `:root`, normalize whitespace, diff sorted declaration sets between two `dist` paths; fail loudly on a missing/non-directory path — never report an empty diff on error (threat matrix: path arguments).
- [x] 0.3 Verify: run it against the baseline vs. itself — empty diff.

## Phase 1: Typography Interface (PR 1, commit 1a)

- [x] 1.1 Add a 13-token `--text-*` block to `@theme` in `src/styles/global.css`: the 11 named tokens plus `--text-title-alt` (`clamp(28px,7vw,40px)`, from `hero.section.astro:38`) and `--text-subtitle-alt` (`clamp(18px,4.6vw,24px)`, from `details.section.astro:110`) — Stage 2 merge candidates (D4). Each value copy-pasted; doc comment records source `file:line`.
- [x] 1.2 Create `src/types/typography.ts`: `TextToken` (13-member union), `TitleSize = TextToken` (mirrors `src/types/palette.ts`).
- [x] 1.3 Create `src/lib/typography.ts`: `TITLE_SIZE_CLASS: Record<TitleSize, string>` lookup (mirrors `src/lib/palette.ts`).
- [x] 1.4 Modify `src/components/Title/title.component.astro`: `fontSize?: string` → `size?: TitleSize`; remove `font-size` from the scoped `<style>` block; keep `define:vars` for `color`/`fontFamily`; apply via `class:list={[TITLE_SIZE_CLASS[size], className]}` (D3).
- [x] 1.5 Migrate `Title`'s 10 call sites, including `hero.section.astro:38` → `title-alt` and `details.section.astro:110` → `subtitle-alt`.
- [~] 1.6 Verify: temporarily pass an invalid `size` at one call site, confirm `pnpm run build` fails on that site, then revert. **Partial / negative result**: the probe was run and reverted, but `pnpm run build` did NOT fail on the invalid value — `astro build` performs no TypeScript diagnostics in this repo (no `astro check` step wired into `build`, and `typescript`/`@astrojs/check` are not installed devDependencies). The `TitleSize` union is correctly typed and would be flagged by an editor/LSP or by `tsc`, but the build script as configured cannot enforce it. See report for detail; no dependency was added to fix this (out of this batch's scope/budget).

## Phase 2: Typography Mechanical Migration (PR 1, commit 1b)

- [x] 2.1 For each of the 13 tokens, run both exact-string searches — `text-[clamp(...)]` (no spaces) and `font-size: clamp(...)` (spaced) — across `calendar`, `countdown`, `polaroid-pair`, `map-modal`, `rsvp-button`, `hero`, `photos`, `details`, and the `index`/`invitacion` pages; replace with the matching utility or `var(--text-*)` (D5 §2).
- [x] 2.2 On the 6 dual-value lines (`index.astro:75`, `map-modal.component.astro:17`, `hero.section.astro:39,56`, `rsvp-button.component.astro:27,30`), substitute only the typography portion; leave the spacing literal untouched for PR 2. **Finding**: only `map-modal.component.astro:17` actually had an exact-match typography literal to substitute; the other 5 either have no exact token match (residual, deferred) or (`hero.section.astro:39`) carry no typography value at all on that exact line — see report for the corrected line-by-line breakdown.
- [x] 2.3 Record `token | literal | occurrences replaced` in the PR body; counts must sum to the pre-change typography occurrence count (D5 §3). Sum = 21, matches. See report for the full table.

## Phase 3: Typography Verification (PR 1)

- [~] 3.1 Run V1–V4 and V7: build exit 0 with baseline-matching warning set (only `lila`) — **pass**; `css-identity.mjs` empty diff — **does not pass**, 9 declaration-count differences, all fully explained (see report), none is an actual computed-value regression; all 13 tokens and their generated utilities present in `dist/_astro/*.css` — **pass**; `rg "text-\[clamp|font-size:\s*clamp" src/` hits equal exactly the PR-body deferral manifest — **pass**, 15 residual lines, listed in report.
- [ ] 3.2 Run V9: manual visual check, 5 widths, against the Phase 0 baseline screenshots — **NOT run by sdd-apply**, no browser tool available in this session. Orchestrator must run this against `openspec/changes/plantillas-multiples/style-baseline.md`'s computed-style hashes.
- [x] 3.3 Add a typography section to `AGENTS.md` at colour-axis depth: the D2 naming rule ("name by the most stable true property"), the token table, the escape-hatch example, and a note on the two provisional Stage-2 tokens.

## Phase 1b: Typography Stage 2 Merge (PR 1b, branches from PR 1)

Out-of-plan addition, requested directly by the user after PR 1 landed. Mints
the two tokens PR 1's residual-literal audit surfaced as gaps (`body-lg` for
the 5-site `clamp(14px,4vw,18px)` cluster, `display` for the deliberately
off-scale "15" numeral) and applies the Stage 2 merges the user reviewed and
approved by exact pixel cost. Spacing stays untouched, per instruction.

- [x] 1b.1 Mint `--text-body-lg: clamp(14px, 4vw, 18px)` and `--text-display: clamp(72px, 22vw, 190px)` in the `@theme` block of `src/styles/global.css`, each with a source `file:line` doc comment matching the block's existing style; `--text-display`'s comment records that it deliberately sits outside the scale (merging into `name-lg` would cost 7px mobile / 20px desktop against a prior deliberate design decision). Added both to `TextToken` (`src/types/typography.ts`) and `TITLE_SIZE_CLASS` (`src/lib/typography.ts`).
- [x] 1b.2 Migrated the 6 exact matches by exact-string search: 5× `clamp(14px,4vw,18px)` → `text-body-lg`/`var(--text-body-lg)` (`details.section.astro:75,76`, `hero.section.astro:60`, `photos.section.astro:54`, `map-modal.component.astro:71`); 1× `clamp(72px,22vw,190px)` → `text-display` (`hero.section.astro:45`).
- [x] 1b.3 Applied the 6 approved merges (pixel cost within the user's bound — 0px mobile except one +0.04px, up to 2px desktop): `clamp(12px,3.6vw,16px)`×2 → `body` (`calendar.component.astro:60,106`); `clamp(13px,3.6vw,17px)` → `body` (`index.astro:75`); `clamp(13px,3.6vw,18px)` → `body` (`rsvp-button.component.astro:27`); `clamp(11px,3vw,15px)` → `caption` (`countdown.component.astro:30`); `clamp(20px,5.2vw,30px)`×2 → `emphasis` (`hero.section.astro:42,56`); `clamp(14px,4vw,16px)` → `body-lg` (`map-modal.component.astro:53`).
- [x] 1b.4 Left `clamp(12px,3.2vw,15px)` in `rsvp-button.component.astro:30` as a documented literal (merging into `caption` would cost 1px on mobile, exceeding the approved 0px-mobile bound) — inline comment added explaining why.
- [x] 1b.5 Updated `AGENTS.md`'s Typography section: added `body-lg`/`display` to the token table, a "Fusiones aplicadas (Stage 2)" table with the 6 merges and their pixel cost, and pointed the escape-hatch section at the one remaining documented one-off.
- [x] 1b.6 Verify: `pnpm run build` exit 0, only the pre-existing `lila` warning; `rg "text-\[clamp|font-size:\s*clamp" src/` returns exactly 1 line (the documented one-off), down from PR 1's 15; all 15 `--text-*` custom properties and all 15 `.text-*` utility rules present in `dist/_astro/*.css`. `git diff --stat`: 56 insertions + 19 deletions = 75 changed lines, well under the 140-line batch budget. `src/lib/layout.ts` and all spacing literals untouched (confirmed via `git status`/`git diff --stat`).

## Phase 4: Spacing Tokens & Migration (PR 2, branches from PR 1)

**Deviation from the plan, recorded per orchestrator instruction before apply**: the
design's assumption that an 8-step scale would absorb most of the measured
`clamp()` spacing values did not hold. The orchestrator measured all 24 distinct
`gap`/`padding`/`margin` values at 360/390/768/1024/1440 and found only 8 fit the
scale exactly (plus the 3 functional constants); the other ~13 are each used once
and would have moved a call site by up to 74px if forced onto the nearest step.
Tasks 4.1–4.4 below were executed against that corrected, measured set — the
11-token structure and site lists happened to already match what tasks.md
specified, so no task text needed rewriting, only this note.

- [x] 4.1 Added the 11-token `--spacing-*` block to `@theme` in `src/styles/global.css`: 8 ordinal steps (`3xs`…`2xl`) plus 3 functionally-named constants — `--spacing-section-gutter`, `--spacing-section-top`, `--spacing-hero-top`. `src/lib/layout.ts` untouched (`git diff --stat` confirms empty diff) — D1 stands, spec.md's corrected wording (see decision `spec-correction-layout`) is what's implemented.
- [x] 4.2 Migrated all 19 exact-match occurrences: the 5 `section-gutter` sites (`hero`, `photos`, `parents`, `closing`, `date`), the 4 `info-cube` `p-lg` sites, then the single/double-site tokens (`calendar` → `3xs`, `hero` → `sm`/`2xs`/`hero-top`, `details` → `section-top`/`2xl`, `map-modal` → `xs`/`xl`, `rsvp-button` → `md`/`xs`).
- [x] 4.3 Completed the spacing half of the 6 dual-value lines from task 2.2: `hero.section.astro:39` (gap→`sm`, pt→`hero-top`) and `:56` (mb→`2xs`) fully migrated; `map-modal.component.astro:17` py→`xs` (px stays literal, no exact match); `index.astro:75` and `rsvp-button.component.astro`'s two sites have no exact spacing token match — left as documented/commented literals (one now carries a proximity comment, see 4.4).
- [x] 4.4 Token | literal | occurrences: `3xs` `clamp(4px,1.5vw,8px)` ×1 · `2xs` `clamp(5px,1.6vw,10px)` ×1 · `xs` `clamp(8px,2.4vw,12px)` ×2 · `sm` `clamp(8px,2.5vw,16px)` ×1 · `md` `clamp(12px,4vw,20px)` ×1 · `lg` `clamp(14px,5vw,28px)` ×4 · `xl` `clamp(20px,6vw,32px)` ×1 · `2xl` `clamp(24px,6vw,48px)` ×1 · `section-gutter` `clamp(16px,6vw,58px)` ×5 · `section-top` `clamp(44px,13vw,108px)` ×1 · `hero-top` `clamp(62px,17.5vw,90px)` ×1. Sum = 19, matches the migrated-occurrence count. Two residual literals got a proximity comment (rsvp-button.component.astro's floating px, details.section.astro's dress-code gap) rather than a token, per the 0.4px/2px tolerance the user set for this round.

## Phase 5: Spacing Verification (PR 2)

- [x] 5.1 V1/V2 pass (build exit 0, only the pre-existing `lila` warning). V4/V5 pass: all 11 `--spacing-*` custom properties and 11 corresponding utilities present in `dist/_astro/*.css`, each backed by a real call site (confirmed one utility class generated per token, matching the occurrence table in 4.4 — no orphaned/dead token). V3 (`css-identity.mjs` empty diff) does **not** pass as literally worded — 20 declaration differences, all explained: 16 are the pre-existing typography diffs already documented in the PR 1/1b batches (unrelated to this batch); the remaining 4 are spacing-specific and all traced: one is a stale baseline-only artifact from the design's own abandoned `--spacing-lg` fallback probe (confirmed absent from the current tree — nothing left to fix), and three are `--spacing-hero-top`'s var()-indirection producing byte-identical computed CSS but tripping the script's naive minification-boundary parsing (verified directly against the built CSS: `.pt-hero-top{padding-top:var(--spacing-hero-top)}` and `--spacing-hero-top:clamp(62px, 17.5vw, 90px)` are both present and correct). `rg "(gap|p[xytblr]?|m[xytblr]?)-\[clamp" src/` hits equal the manifest plus the Q1/Q2 geometry exclusions (10 residual lines, listed in the apply report).
- [ ] 5.2 V9/V10 (5-width manual check, palette switch) — **NOT run by sdd-apply**, no browser tool available in this session. Orchestrator to run, same as the still-open 3.2 from PR 1.
- [x] 5.3 Added a Spacing section to `AGENTS.md` at colour/typography-axis depth: magnitude-rank naming rule, the 11-token table, the `layout.ts`/geometry-exclusion boundary, and — the important part — the "spacing is mostly bespoke" finding (only 11 of 24 measured values are shared or exact-scale fits; the rest stay literal on purpose, not as unfinished work).

## Phase 6: Follow-up (not blocking PR 1 or PR 2)

- [~] 6.1 Carry forward the open Stage 2 question (does "visually identical" forbid all pixel change, or only visible change?) — both PRs here are Stage 1 only and ship regardless of its answer. **Partially resolved by PR 1b**: the user explicitly approved a bounded answer for the 6 merges in Phase 1b (0px mobile, up to 2px desktop) — this does not resolve the general question for remaining candidates such as the `subtitle-alt`/`title-alt` provisional tokens, which still await an explicit Stage 2 decision.
