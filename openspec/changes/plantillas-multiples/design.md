# Design — plantillas-multiples (work unit 1: typography and spacing tokenization)

Tokens live in the `@theme` block of `src/styles/global.css` and reach components as
generated Tailwind utilities. `Title` gets a closed `size` union backed by a lookup
table. The work ships as a **two-PR chain**, typography first. Stage 1 is proved
value-preserving by construction plus a dependency-free built-CSS identity check.

- **Change**: `plantillas-multiples` · **Phase**: design · **Work unit**: 1 of 2
- **Artifact store**: hybrid (mirror of Engram topic `sdd/plantillas-multiples/design`)
- **Contract**: `openspec/changes/plantillas-multiples/proposal.md` (approved)

## Blocking unknown — closed

The orchestrator probed tailwindcss 4.3.3 in this repo. Named `--spacing-<name>` and
`--text-<name>` keys **do** generate `p-*` / `gap-*` / `m-*` / `text-*` utilities, and
those utilities compile to `var(--…)`, not to inlined literals.

Consequences adopted: the `p-[var(--spacing-lg)]` fallback is **dropped from the design**;
tokens are consumed as plain utilities everywhere. Tailwind tree-shakes unreferenced theme
variables (`--color-photo-frame` was silently dropped until something used it), so **every
minted token must have at least one call site in the same PR**. No aspirational steps.

## Architecture decisions

### D1 — Where tokens live

| Option | Verdict |
|---|---|
| All scale values in `@theme`, `layout.ts` untouched | **Chosen** |
| 3 named constants in `src/lib/layout.ts` (proposal) | **Rejected — see below** |

**Push-back on the proposal.** All three named constants (`SECTION_GUTTER` ×5,
`SECTION_TOP`, `HERO_TOP`) are consumed today as Tailwind utility classes
(`px-[clamp(16px,6vw,58px)]`, `pt-[…]`), not as `style` attributes. `layout.ts` exists for
values composed inside `calc()` in TypeScript template literals (`OUT`, `OUT_TOP`) — a job
`@theme` cannot do. Routing class-consumed values through `layout.ts` would force a
mechanism change from class to inline style, which raises specificity and loses responsive
variants, for no benefit. So they become functionally-named spacing tokens
(`--spacing-section-gutter`, `--spacing-section-top`, `--spacing-hero-top`) and
`layout.ts` is **not modified in this work unit**.

Comment style mirrors the palette block exactly: one header block comment per axis stating
the naming rule and the override mechanism, then one `/** … */` line per token.

**Discovered duplication, deliberately deferred**: `clamp(24px, 8vw, 80px)` exists twice —
`global.css:52` and `BODY_PADDING_TOP` in `layout.ts`. Unifying it requires rewriting
`OUT_TOP`'s `calc()` composition to consume a CSS variable. That is a *mechanism* change,
so it cannot ride Stage 1's value-preserving proof and needs its own evidence. Recorded as
a follow-up, not silently left.

### D2 — Naming rule

The proposal argues "ordinal for scales, functional for constants". **Partially agree, and
the framing is inconsistent with its own token table** — `caption`, `body`, `lead`,
`subtitle`, `title`, `heading`, `name` are *role* names, not ordinals.

The convention's real test is the one the colour block already states: *can the name become
a lie?* Answer per axis:

| Axis | Most stable true property | Naming | Why the alternative lies |
|---|---|---|---|
| Colour | function | `--color-ink` | `--color-purple` lies on the first palette swap |
| Typography | typographic role | `--text-body` | ordinals lie when a step is inserted; roles survive rescaling |
| Spacing | magnitude rank | `--spacing-lg` | no role vocabulary exists; `--spacing-card-padding` lies on second reuse |
| Layout constants | function | `--spacing-section-gutter` | an ordinal hides that all five sections must move together |

One rule — **name by the most stable true property** — three outcomes. This is what goes
into `AGENTS.md`, replacing "ordinal for scales". `--text-title-lg` / `--text-name-lg` mix
role and variant; that is accepted (variant of a role, still true under rescaling).

### D3 — `Title` size contract

| Option | Value-preserving proof lives in | Escape hatch | Verdict |
|---|---|---|---|
| A: `size` → `var(--text-X)` through existing `define:vars` | inline `style` in built HTML | **broken** | Rejected |
| B: `size` → Tailwind class; drop `font-size` from the scoped block | built CSS | works | **Chosen** |

Option A fails on a cascade detail: the scoped rule `h1[data-astro-cid-…]` is specificity
(0,1,1) and beats an unscoped `.text-[…]` utility at (0,1,0), so a caller passing a one-off
class would be silently ignored. Option B removes the scoped `font-size` declaration
entirely, so there is nothing to beat — and it moves all font-size evidence into CSS where
the identity check (D6) can see it, leaving only a class-name diff in the HTML.

```ts
// src/types/typography.ts   — mirrors src/types/palette.ts
export type TextToken = "caption" | "body" | … | "name-lg";
export type TitleSize = TextToken;

// src/lib/typography.ts     — mirrors src/lib/palette.ts
export const TITLE_SIZE_CLASS: Record<TitleSize, string> = { title: "text-title", … };
```

`Title` keeps `define:vars` for `color` and `fontFamily`; only `font-size` leaves it.
Sizes apply via `class:list={[TITLE_SIZE_CLASS[size], className]}`.

`TitleSize` aliases the **full** token union rather than only the 8 sizes `Title` uses
today. A narrower union would reject a legitimate future size and force a widening edit,
and `Title` is already used for every heading level in this repo (`details.section` renders
20px headings through it), so restricting it would be false precision. It still satisfies
the contract: drift is a type error.

**`color` and `fontFamily` are explicitly out of scope.** Reasons, in order: the proposal
scopes only `fontSize`; both already resolve to existing tokens (`var(--color-ink)`,
`var(--font-baskervville)`), so the drift mechanism that produced 22 near-duplicate sizes
does not apply to them; and widening the PR spends budget without reducing risk. The
consequence — `Title` ships one release with a typed `size` beside two raw strings — is
accepted and recorded as a follow-up, together with `Frame`'s `gap?: string`, which is the
same defect class.

### D4 — Provisional tokens, because a union must be total

Two `Title` call sites hold values with no exact token: `hero.section:38`
`clamp(28px,7vw,40px)` (near-`title`) and `details.section:110` `clamp(18px,4.6vw,24px)`
(near-`subtitle`). At 360 px the first differs from `--text-title` by 4 px, so merging it in
Stage 1 would break the invariant.

Because `size` is a closed union, it must be **total over its call sites** or those two
sites cannot be expressed. So Stage 1 mints **13** typography tokens: the 11 named plus
`--text-title-alt` and `--text-subtitle-alt`, each carrying a `Stage 2 merge candidate`
comment. Stage 2 deletes them, and the union shrinking turns the merge into a
compile-error-driven migration rather than a grep.

**Boundary**: this totality requirement applies *only* to tokens reachable through a typed
prop. Raw `text-[…]` call sites have no such requirement and simply keep their literal until
Stage 2. Spacing gets no provisional tokens for the same reason — no typed prop consumes it.

### D5 — Enforcing Stage 1's value-preserving property

Asserting it is not enough; the procedure must make a mistake *visible*.

1. **Bind by copy, never by retyping.** Each token's value is copy-pasted from an existing
   call site, and its doc comment records the `file:line` it was lifted from. A reviewer
   verifies token↔literal at one named place.
2. **Substitute by exact-string search, not by judgement.** Because the search key *is* the
   literal, the failure mode "swapped a near-duplicate" is structurally unreachable.
   **Gotcha**: the same value has two spellings — `text-[clamp(11px,3vw,14px)]` (no spaces,
   Tailwind arbitrary value) and `font-size: clamp(11px, 3vw, 14px)` (spaced, scoped CSS).
   Run **both** searches per token.
3. **Balance the arithmetic.** The PR body carries `token | literal | occurrences replaced`.
   The counts must sum to the pre-change occurrence count. A reviewer checks addition, not
   44 diff hunks.
4. **Audit the residue.** After substitution, the surviving-literal search must return
   *exactly* the pre-agreed deferral list. An extra hit is a missed migration; a missing hit
   is an over-eager merge. The invariant becomes countable.
5. **Backstop**: the built-CSS identity check (D6) catches anything 1–4 missed.

**Where a surviving literal is documented** — split by lifetime, so nothing rots:

| Kind | Home | Why |
|---|---|---|
| Art-directed one-off (permanent) | inline comment at the call site | the next editor must see it |
| Stage 2 merge candidate (temporary) | manifest table in the PR body | dies when Stage 2 lands; would rot in source |

This keeps success criterion #1 ("no unjustified literal") true at **every** point in the
chain, not only after Stage 2.

### D6 — Verification: one small script, not a browser runner

**Position: add a check, but not Playwright.** Playwright costs a dev dependency, a ~200 MB
browser download, and a config file, to sample five widths of a change that ships twice and
then leaves the critical path. Disproportionate.

There is a cheaper check with *higher* signal and **zero new dependencies**: every value is
a `clamp()` literal, and every generated utility compiles to either that literal or
`var(--token)` defined in `:root` of the same stylesheet. So the resolved declaration set is
computable from the built CSS alone — no browser, and it proves identity at **all** widths
simultaneously rather than sampling five.

`scripts/css-identity.mjs` (~90 lines, plain Node, matching `scripts/recolor-assets.mjs`):
takes two `dist` paths, expands `var(--text-*)` / `var(--spacing-*)` back to their `:root`
values, normalizes whitespace, and diffs the sorted declaration set. **Stage 1 passes iff
the diff is empty.**

Honest limits: it sees CSS only. It does not cover HTML class attributes or `define:vars`
inline styles — which is a second reason to prefer D3 option B, since that moves font-size
out of inline styles and into the script's field of view. The browser check remains the
acceptance gate for layout that CSS-level identity cannot express.

## Data flow

```
src/styles/global.css  @theme
   --text-*                     --spacing-*
      │                              │
      │  Tailwind generates          │  Tailwind generates
      │  .text-body{font-size:var(--text-body)}
      │                              │  .p-lg{padding:var(--spacing-lg)}
      │                              ├──> class="p-lg gap-xs px-section-gutter"
      │                              └──> var(--spacing-lg) inside scoped <style>
      │
      └──> src/types/typography.ts   TextToken
                    │
                    └──> src/lib/typography.ts   TITLE_SIZE_CLASS
                                  │
                                  └──> Title  size?: TitleSize  ──> class:list

src/lib/layout.ts  (UNCHANGED)  OUT / OUT_TOP  ──> style="…"  calc() composition
```

## File changes

| File | Action | Description |
|---|---|---|
| `src/styles/global.css` | Modify | `@theme` gains a 13-token `--text-*` block (PR 1) and an 11-token `--spacing-*` block (PR 2) |
| `src/types/typography.ts` | Create | `TextToken`, `TitleSize` — mirrors `src/types/palette.ts` |
| `src/lib/typography.ts` | Create | `TITLE_SIZE_CLASS` lookup — mirrors `src/lib/palette.ts` |
| `src/components/Title/title.component.astro` | Modify | `fontSize?: string` → `size?: TitleSize`; `font-size` leaves the scoped block |
| `src/pages/index.astro`, `src/pages/invitacion.astro` | Modify | Call-site migration |
| `src/components/**` (13 files) | Modify | Call-site migration |
| `scripts/css-identity.mjs` | Create | Dependency-free built-CSS declaration diff |
| `AGENTS.md` | Modify | Typography and spacing sections at colour-axis depth, incl. the D2 naming rule |
| `src/lib/layout.ts` | **Unchanged** | See D1 |

## Migration order and slicing

**Confirm the two-PR split by axis. Refine the sizes. Add one hard constraint the proposal
does not state: it must be a chain, not two parallel PRs.**

Six lines carry *both* a typography and a spacing value — `index:75`, `map-modal:17`,
`hero:39`, `hero:56`, `rsvp-button:27`, `rsvp-button:30`. Parallel PRs would conflict on
every one. PR 2 must branch from PR 1.

Typography first, but for a different reason than the proposal gives: it contains the only
**interface** change (`Title`), and interface changes should land before anything else in
the chain — and before work unit 2 — builds on the final shape.

Line counts measured from the current tree (87 `clamp(` occurrences across 18 files; the
proposal's 116 counts individual values, several per line). Git counts *changed lines*:

| PR | Content | Est. lines |
|---|---|---|
| **PR 1 — typography** | 13 tokens (~40) · types + lib (~35) · 44 changed call-site lines (~88) · `AGENTS.md` (~25) | **~190** |
| **PR 2 — spacing** | 11 tokens (~34) · 22 changed call-site lines (~44) · `AGENTS.md` (~25) · `css-identity.mjs` (~90, or fold into PR 1) | **~105 + script** |

PR 2 is materially smaller than the proposal's ~185 forecast, because spacing values cluster
onto fewer lines. Both slices sit comfortably inside the 400-line budget.

**PR 1 internal ordering — two commits, so review is two-phase:**

| Commit | Files | Review weight |
|---|---|---|
| 1a — interface | `global.css` `@theme`, `types/typography.ts`, `lib/typography.ts`, `Title`, its 10 call sites | ~70 lines, read carefully |
| 1b — mechanical | `calendar`, `countdown`, `polaroid-pair`, `map-modal`, `rsvp-button`, `hero`, `photos`, `details`, `index` raw `text-[…]` | ~120 lines, skim against the count table |

**PR 2 file order** (cheapest proof first): `global.css` `@theme` → `section-gutter` ×5
(`hero`, `photos`, `parents`, `closing`, `date` — one identical substitution, five sites,
validates utility generation on the highest-confidence value) → `info-cube` ×4 (`-lg`) →
single-site tokens (`calendar`, `map-modal`, `details`, `rsvp-button`, `hero`) → deferral
comments.

Each PR is a single revert. Tokens are additive in `@theme`, so reverting call sites alone
restores previous behaviour even if the token block stays.

## Geometry exclusion — decision procedure

Apply in order; **first match wins**. Q1 is mechanical, so two people cannot diverge on the
~22 decoration values. Q3 makes the residual judgement *visible* instead of pretending the
boundary is crisp.

| # | Test | Outcome |
|---|---|---|
| **Q1** | Does the value set `width`, `height`, `min/max-` of either, `top`/`right`/`bottom`/`left`, `inset`, `translate`/`transform`, `flex-basis`, or a `--custom` property consumed only by those? | **Excluded.** Mechanical; no comment needed |
| **Q2** | Does it apply to a purely ornamental element — one whose removal changes no information (decoration `<Image>`, corner decor, gift icon)? | **Excluded.** No comment needed |
| **Q3** | Otherwise (`gap`, `row/column-gap`, `padding*`, `margin*`, `font-size`) | **Tokenize.** Opting out requires a one-line comment naming the reason |

Q1 alone covers `global.css:141`, `polaroid-pair:51,79`, `countdown:23,25`,
`gift-icons:14,38`, `hero:51`, `music-player:18`, `details:92` (`--dc-*`),
`parents:37,43`, and every decoration `w-[…]` in `hero`/`photos`/`closing`/`date`/`details`.

Worked examples of the Q3 boundary, to calibrate:

| Value | Reaches | Call |
|---|---|---|
| `hero:42` `mt-[clamp(18px,5.5vw,35px)]` | Q3 | Optical glyph alignment of the ampersand, not block separation → comment and keep |
| `polaroid-pair:84` padding | Q3 (the polaroid holds content, so Q2 misses) | Art-directed wide bottom border → comment and keep |
| `details:86` `gap-[clamp(8px,2.5vw,14px)]` | Q3 | Content separation, near-`-sm` → keep literal in Stage 1, PR-body manifest, merge in Stage 2 |

**Also out of scope for this work unit**, stated so it is not inferred: `line-height`
(`leading-[0.85]`), `letter-spacing` (`tracking-[0.12em]`), `border-radius`, and
`font-weight`.

## Verification

**Capture the baseline before the first edit** — otherwise "identical" is unverifiable from
memory. On the merge-base commit: `pnpm run build`, then
`Copy-Item -Recurse dist $env:TEMP\vi-baseline-dist`, and screenshot `/` and `/invitacion`
at all five widths.

| # | Measurement | Command | Pass condition |
|---|---|---|---|
| V1 | Build | `pnpm run build` | exit 0 |
| V2 | Warning set | build console output | exactly one warning — the `lila` on-accent 3.28:1 line; string-compare against baseline |
| V3 | Declaration identity | `node scripts/css-identity.mjs $env:TEMP\vi-baseline-dist dist` | **empty diff** (Stage 1); Stage 2 diff must equal the approved merge table line for line |
| V4 | Token emission | search `dist/_astro/*.css` for each minted token name | all present. A missing token means a dead token *or* a missed migration — investigate, never ignore |
| V5 | Utility generation | search `dist/_astro/*.css` for `.text-title{`, `.p-lg{`, `.px-section-gutter{`, `.p-2xl{` | present. `2xl`/`3xs` keys are unproven — the probe used `testkey`; V5 is where a parse failure surfaces |
| V6 | Class-name scanning | V5 covers it | confirms Tailwind's content scanner found the literal strings inside `src/lib/typography.ts` |
| V7 | Residual font literals | `rg "text-\[clamp\|font-size:\s*clamp" src/` | hit set **exactly equals** the PR-body deferral manifest |
| V8 | Residual spacing literals | `rg "(gap\|p[xytblr]?\|m[xytblr]?)-\[clamp" src/` | hit set **exactly equals** the manifest plus Q1/Q2 exclusions |
| V9 | Visual, five widths | devtools responsive, `/` and `/invitacion` at 360, 390, 768, 1024, 1440 | no text baseline or block edge moves against the baseline screenshots |
| V10 | Palette switch | set `palettes.salvia` in `src/config/invitation.ts`, `pnpm run assets`, rebuild | no regression; revert afterwards |

**Why those five widths, and which are load-bearing.** At 1440 nearly every `clamp()` is
pinned to its `max`, so a wrong `min` or a wrong `vw` slope is *invisible* there. 360 and
390 are the load-bearing widths — most values sit at or just above their `min`, where the
near-duplicates differ. 768 exercises mid-slope, 1024 is where several values first reach
`max`. **360 and 390 must never be skipped**; 1440 alone proves almost nothing.

**Failure recognition.** V3: any non-empty output line, which names selector + property.
V7/V8: any hit not in the manifest. V9: a side-by-side screenshot pair at the same width
where any baseline or edge moves.

## Future per-template scale overrides — leave the door open, build nothing

The probe confirmed typography and spacing tokens are runtime-overridable on `<html>`,
exactly like colour. **Position: acknowledge it, design nothing for it.**

The door is already open at zero cost — it is a consequence of using `@theme` at all, not
something to build. The only design obligation is a *negative* one, already implied by this
change: never inline a scale literal where a variable cannot reach it.

Do **not** add a `resolveTypography()` / `typographyToStyle()` sibling to `palette.ts`. The
palette resolver exists because palettes have derived fields and contrast constraints to
validate; a type scale has neither, so the abstraction would carry no work. One instance is
not enough to validate an abstraction — revisit when a second template exists.

One constraint to record now: because Tailwind tree-shakes, an override can change the
*value* of a step but cannot introduce a step the base template never references.

## Threat matrix

Mostly N/A — this change has no routing, VCS/PR automation, or executable-file
classification boundary. One applicable row from the new script:

| Row | Status | Requirement |
|---|---|---|
| Subprocess / shell | **N/A** | `css-identity.mjs` must not shell out; pure `node:fs` reads |
| Path arguments | **Applicable** | Takes two directory paths. Must read only, write nothing, and fail loudly on a missing or non-directory path rather than silently reporting an empty diff — a false "identical" is the one dangerous failure |
| Routing / process integration | **N/A** | Manual dev-time script, not wired into `pnpm run build` |

## Open questions

- [ ] **Does "visually identical" forbid all pixel change, or only visible change?** Carried
      forward from the proposal. Blocks Stage 2 only; Stage 1 proceeds either way, and this
      is best answered with Stage 1's real diffs in hand.
- [ ] Fold `css-identity.mjs` into PR 1 (so PR 1 verifies itself) or ship it as a preceding
      ~90-line PR 0? PR 0 is cleaner to review and lets the baseline be captured with the
      tool that will judge it. Recommend PR 0; defer to the delivery decision.

## Follow-ups recorded, not done

- `Title`'s `color` / `fontFamily` raw string props, and `Frame`'s `gap?: string` — same
  defect class as `fontSize`, out of scope here (D3).
- `clamp(24px, 8vw, 80px)` duplicated between `global.css:52` and `layout.ts`
  `BODY_PADDING_TOP` — a mechanism change, not a substitution (D1).
- `line-height`, `letter-spacing`, `border-radius`, `font-weight` — untokenized.
