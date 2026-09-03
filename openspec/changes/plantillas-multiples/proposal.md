# Proposal — plantillas-multiples (work unit 1)

Tokenize typography and spacing so the design system has one source of truth per axis
before any code is shared across client invitations.

- **Change**: `plantillas-multiples`
- **Phase**: propose
- **Work unit**: 1 of 2 — typography and spacing tokenization only
- **Artifact store**: hybrid (mirror of Engram topic `sdd/plantillas-multiples/proposal`)
- **Branch at proposal time**: `refactor/atomizacion`

## Intent

The colour axis is systematized: one line in `src/config/invitation.ts` retints the whole
site, and `pnpm run build` warns on WCAG failures. Typography and spacing are not. They are
116 `clamp()` literals spread across 18 files, and `Title` accepts `fontSize?: string`, a prop
that cannot be wrong — the plausible mechanism by which near-duplicates accumulated.

The business reason to do this **now**, before extraction: the entire value of a shared
library is fix-once-propagate-everywhere. Publishing v1 with 116 uncoordinated values
guarantees a second propagation cycle later, against live client sites in the field. Fixing
drift in one repo is a diff; fixing it across N pinned client repos is a campaign.

## Measured baseline

Counted in this repo today (`clamp(` occurrences under `src/`, deduplicated ignoring
whitespace). **These numbers differ from the ones in the task brief** — reported openly:

| Bucket | Distinct values | Tokenize? |
|---|---|---|
| Typography — `text-[…]`, `font-size:` in scoped styles, `Title` `fontSize` props | 22 (+ the raw `"40px"` default) | Yes |
| Spacing — `gap`/`p*`/`m*` utilities and scoped padding/margin | ≈23 | Yes |
| Decoration and element geometry — `w`/`h`/`top`/`right` of decorations, polaroid frames, countdown circles | ≈22 | **No** |

Total occurrences: 116 (the brief said 114; the brief's typography figure of 18 missed the
`Title` prop call sites). Exact per-value classification of the scoped-CSS entries is a
spec-phase deliverable.

Verified near-duplicates — identical minimum and `vw` slope, differing only in the maximum:

- `clamp(13px,3.6vw,16px)` / `…,17px)` / `…,18px)`
- `clamp(14px,4vw,16px)` / `clamp(14px,4vw,18px)`
- `clamp(11px,3vw,14px)` / `clamp(11px,3vw,15px)`
- `clamp(18px,5vw,24px)` / `clamp(18px,4.6vw,24px)`
- `clamp(24px,6vw,40px)` / `clamp(28px,7vw,40px)`

The third bucket is the important finding: roughly a fifth of the literals are art-directed
one-off geometry. Each decoration image has its own natural size. Forcing them onto a shared
scale would couple unrelated images and manufacture false reuse.

## Scope

### In scope

- A typography scale in the `@theme` block of `src/styles/global.css` (11 steps).
- A spacing scale in the same block (8 steps) plus 3 named layout constants in `src/lib/layout.ts`.
- Migration of every typography and spacing call site across both pages and 13+ components.
- Replacing `Title`'s `fontSize?: string` prop with a closed union.
- Documenting both axes in `AGENTS.md`, matching how the colour axis is documented.

### Out of scope (non-goals)

Deferred deliberately, not forgotten. See `exploration.md` → *Options considered* and
*Work units for the proposal* #2.

| Non-goal | Where it belongs |
|---|---|
| Library extraction, package and workspace boundaries | Work unit 2, after a time-boxed spike |
| Per-client repositories and scaffolding | Work unit 2 |
| Distribution mechanism (npm / GitHub Packages / git dependency) | **Left open by explicit user decision.** Recommend, do not decide |
| Tier A and Tier B starter shapes | Work unit 2 |
| Dead assets (~36 MB) and `.git` history (69 MB) | Moot under the recommended architecture |
| Decoration and element geometry | Stays as arbitrary values |
| Colour system, `Title`'s `color` / `fontFamily` string props | Follow-up |

### Recorded context (constrains later work, no work here)

- **Delivered invitations are frozen by version pinning, not by copying.** The site is
  static, so a delivered invitation is already frozen — nothing rebuilds it. Pinning costs no
  more than copying and preserves the option to deliberately fix one client. Constrains
  work unit 2.
- **Demo templates use placeholder photos; real invitations use real photos.** This change
  touches no client data, config, or photos, so it neither exposes nor constrains that rule.
  It becomes relevant only for a future showcase surface.

## Capabilities

### New capabilities

- `design-tokens`: typography and spacing scales, naming rules, how components consume them,
  the escape hatch for genuine one-offs, the visual-identity invariant, and `Title`'s size contract.

### Modified capabilities

None. `openspec/specs/` contains only `.gitkeep`.

## Approach

### Two stages, so "visually identical" is provable rather than asserted

| Stage | Content | Pixel change |
|---|---|---|
| 1 — value-preserving | Each token is bound to a literal that **already exists**; every call site using that exact literal is swapped | **Zero, by construction** |
| 2 — merges | Each near-duplicate collapse listed individually with before/after computed px, reviewer-approved one by one | Bounded, explicit, listed |

This resolves the central tension. The bulk of the work becomes a mechanical substitution
whose correctness is visible in the diff, and every intentional pixel change is isolated into
a small, reviewable set instead of hiding inside a 116-line refactor.

### Typography scale — 11 steps for 22 values

Justified by the clusters actually present, not imported from elsewhere. Values are today's
literals.

| Token | Value | Replaces |
|---|---|---|
| `--text-caption` | `clamp(11px,3vw,14px)` | the 14/15px group (3) |
| `--text-body` | `clamp(13px,3.6vw,16px)` | the 16/17/18px group (5) |
| `--text-lead` | `clamp(15px,4.4vw,26px)` | 1 |
| `--text-subtitle` | `clamp(18px,5vw,24px)` | the 5vw/4.6vw pair (2) |
| `--text-emphasis` | `clamp(20px,5vw,28px)` | the 28/30px pair (2) |
| `--text-figure` | `clamp(22px,7vw,36px)` | countdown numerals (1) |
| `--text-title` | `clamp(24px,6vw,40px)` | the 40px pair (2) |
| `--text-title-lg` | `clamp(26px,8vw,64px)` | 1 |
| `--text-heading` | `clamp(40px,11vw,88px)` | 1 |
| `--text-name` | `clamp(48px,16vw,128px)` | 1 |
| `--text-name-lg` | `clamp(64px,20vw,170px)` | the 170/190px pair (2) |

Six body/UI steps and five display/script steps, because the values genuinely form two
families: body text tops out at 36px, script headings start at 24px and run to 190px.

### Spacing — 8 ordinal steps plus 3 named constants

Steps: `--spacing-3xs` `clamp(4px,1.5vw,8px)`, `-2xs` `clamp(5px,1.6vw,10px)`,
`-xs` `clamp(8px,2.4vw,12px)`, `-sm` `clamp(8px,2.5vw,16px)`, `-md` `clamp(12px,4vw,20px)`,
`-lg` `clamp(14px,5vw,28px)`, `-xl` `clamp(20px,6vw,32px)`, `-2xl` `clamp(24px,6vw,48px)`.

Named constants extend the pattern `src/lib/layout.ts` already establishes:
`SECTION_GUTTER` = `clamp(16px,6vw,58px)` (appears 5×), `SECTION_TOP` = `clamp(44px,13vw,108px)`,
`HERO_TOP` = `clamp(62px,17.5vw,90px)`.

**On naming.** The repo convention is function-names, because `--color-purple` would become a
lie the moment the palette changes. That reasoning does not transfer to a magnitude scale:
ordinal names stay true under rescaling, whereas `--spacing-card-padding` becomes false the
moment a second component reuses it. So ordinal for the scale, functional for the layout
constants — consistent with the convention's intent.

### How a component consumes a token

- Tailwind 4 generates `text-body`, `p-lg`, `py-xs` from `--text-*` / `--spacing-*` in
  `@theme` — the same mechanism already proven in-repo for `--color-*` and `--font-*`.
- Scoped `<style>` blocks use `var(--text-body)` directly.
- `style` attributes import the named constants from `src/lib/layout.ts`, as today.

**Flagged for design:** Tailwind 4 treats `--spacing` primarily as a single base multiplier.
Whether named `--spacing-<name>` keys generate utilities MUST be confirmed with
`pnpm run build` before the spacing PR. Fallback if not: `p-[var(--spacing-lg)]`.

### `Title` prop API

| | Today | Proposed |
|---|---|---|
| Prop | `fontSize?: string` = `"40px"` | `size?: TitleSize` = `"title"` |
| Domain | any CSS string — cannot be wrong | closed union of the 11 token names |
| Result | drift is invisible | drift is a type error |

The escape hatch: a genuine one-off passes `class="text-[clamp(…)]"` through the existing
`class` prop and MUST carry a comment saying why it is not a token. This mirrors the palette
escape hatch already documented in `AGENTS.md` (hand-writing a palette object instead of
using a named one). Not everything has to become a token — but opting out has to be visible.

### Merge decision rule

- **Default heuristic**: merge only when minimum and `vw` slope are identical and the maximum
  differs by ≤2px. Never merge automatically when the slope differs.
- Any merge shifting computed size by >1px at any checked width needs individual approval.
- Rejected merges keep their own token or their arbitrary value. Both outcomes are acceptable.

## Alternatives considered

| Alternative | Tradeoff | Verdict |
|---|---|---|
| Do nothing; tokenize during extraction | Free now, but ships v1 with 116 uncoordinated values to pinned client repos | Rejected — this is the exploration's core argument |
| One uniform rule: tokenize all 116 | Simple to state | Rejected — the ≈22 decoration sizes are art-directed one-offs; a shared token manufactures false reuse |
| Adopt a generic scale (Tailwind default, 1.25 modular) | Off the shelf, familiar | Rejected — changes every computed size, violating the visual-identity constraint outright |
| Typography only; defer spacing | Fits one PR | Fallback — but leaves the larger inconsistency unsolved. Prefer the 2-PR split |
| Stage 1 only, never merge | Perfectly safe | Rejected as an end state — preserves all 22 near-duplicates and the drift. Adopted as Stage 1 |

## Affected areas

| Area | Impact | Description |
|---|---|---|
| `src/styles/global.css` | Modified | `@theme` gains `--text-*` and `--spacing-*` blocks |
| `src/lib/layout.ts` | Modified | 3 named section constants |
| `src/components/Title/title.component.astro` | Modified | `fontSize: string` → `size: TitleSize` |
| `src/pages/index.astro`, `src/pages/invitacion.astro` | Modified | Call-site migration |
| `src/components/**` (13+ files) | Modified | Call-site migration |
| `AGENTS.md` | Modified | Typography and spacing sections |

## Changed-line forecast

| Item | Estimate |
|---|---|
| ~116 call-site substitutions (1 deletion + 1 addition each) | ~230 |
| `@theme` token blocks, commented in repo style | ~70 |
| `Title` API plus its 11 call sites | ~30 |
| `src/lib/layout.ts` constants | ~15 |
| `AGENTS.md` documentation | ~40 |
| **Total** | **~385** |

**400-line budget risk: High.** ~385 is at the ceiling with no margin, and the estimate
excludes Stage 2 merge edits. Recommend a split rather than hiding it:

- **PR 1 — typography** (~200): `--text-*`, all font-size call sites, `Title` API, docs.
- **PR 2 — spacing** (~185): `--spacing-*`, spacing call sites, `layout.ts`, docs.

Each slice has an autonomous scope, its own verification, and an independent revert.

## Verifying visual identity

The constraint is non-negotiable, so it must be proven, not asserted.

1. `pnpm run build` passes with no new warnings. The known `lila` contrast warning is
   pre-existing and must remain the only one. This is the **only automated signal** — no test
   runner, linter, formatter, or standalone type-check exists.
2. Stage 1 correctness is structural: every token is bound to an existing literal, so a
   correct substitution cannot change computed output. The diff is the evidence.
3. Computed-style comparison in a real browser at **five widths — 360, 390, 768, 1024, 1440**.
   Multiple widths are mandatory, not thorough: every value is a `clamp()` with a `vw` term,
   so two builds can agree at one width and diverge at another.
4. Manual visual check per `openspec/config.yaml`: both `/` and `/invitacion`, mobile and
   desktop, and re-checked after switching palette (`pnpm run assets` regenerates decorations).
5. Stage 2 ships with a table of every merged value and its computed before/after at those
   five widths.

A scripted computed-style diff (e.g. Playwright) would make step 3 repeatable, but **requires
installing a dev dependency that does not exist today**. Decide in design; do not assume it.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| A deliberate optical adjustment merged as if accidental | Medium | Stage 1 changes zero pixels; every merge is individually listed and approved |
| No automated safety net beyond `pnpm run build` | High | Multi-width computed-style comparison plus the documented manual check; Stage 1 edits are mechanical and diff-reviewable |
| Tailwind 4 named `--spacing-*` keys may not generate utilities | Medium | Confirm with `pnpm run build` in design; fallback `p-[var(--spacing-lg)]` |
| Work exceeds the 400-line budget | High | Two chained PRs split by axis |
| A regression visible at only one viewport | Medium | Five widths checked, not two |
| Scope drifts into decoration geometry | Medium | Third bucket explicitly out of scope |
| Counts here differ from the brief (22 vs 18, 116 vs 114) | — | Stated openly; exact per-value classification is a spec-phase deliverable |

## Rollback plan

Each PR is a single revert. Tokens are additive in `@theme`, so reverting call sites alone
restores previous behaviour even if the token block stays. No asset regeneration is needed —
`scripts/recolor-assets.mjs` and the palette pipeline are untouched. If one merged value
proves wrong after merge, revert that single value to its arbitrary form: a one-line change.

## Dependencies

- None to install for Stage 1. A browser-automation dev dependency is **optional** and only
  if the design phase chooses to script step 3 of verification.

## Open decision (needs user confirmation before Stage 2, not blocking Stage 1)

**Does "visually identical" forbid all pixel change, or only visible change?** If strictly
all, Stage 2 cannot run and all 22 typography values keep individual tokens — the scale still
prevents *new* drift but does not remove existing drift. The staged approach is designed so
this can be answered after Stage 1 lands, with real diffs to look at.

## Success criteria

- [ ] No `clamp()` font-size or spacing literal remains at a call site without a comment justifying it as a one-off.
- [ ] `Title` no longer accepts an arbitrary CSS string for size; passing an invalid size is a type error.
- [ ] Typography values reduced from 22 to 11 tokens; spacing to 8 steps plus 3 named constants.
- [ ] `pnpm run build` passes with no new warnings.
- [ ] Computed styles match the pre-change build at 360, 390, 768, 1024 and 1440 px, except for values listed in the Stage 2 merge table.
- [ ] Manual visual check passes on `/` and `/invitacion`, mobile and desktop, after a palette switch.
- [ ] Both axes documented in `AGENTS.md` at the same level as the colour axis.
- [ ] Each PR stays within the 400-line review budget.
