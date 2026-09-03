# Design Tokens Specification

## Purpose

Defines the typography and spacing token scales replacing ~116 `clamp()`
literals in `src/`, mirroring the colour system's pattern. Work unit 1 only:
tokenization is value-preserving by construction; later, approved merges may
change a pixel.

## Requirements

### Requirement: Typography Token Scale

The system MUST define 11 named `--text-*` tokens in `@theme`
(`src/styles/global.css`), each equal to a literal present at one or more
call sites in `src/`.

| Token | Value |
|---|---|
| `--text-caption` | `clamp(11px,3vw,14px)` |
| `--text-body` | `clamp(13px,3.6vw,16px)` |
| `--text-lead` | `clamp(15px,4.4vw,26px)` |
| `--text-subtitle` | `clamp(18px,5vw,24px)` |
| `--text-emphasis` | `clamp(20px,5vw,28px)` |
| `--text-figure` | `clamp(22px,7vw,36px)` |
| `--text-title` | `clamp(24px,6vw,40px)` |
| `--text-title-lg` | `clamp(26px,8vw,64px)` |
| `--text-heading` | `clamp(40px,11vw,88px)` |
| `--text-name` | `clamp(48px,16vw,128px)` |
| `--text-name-lg` | `clamp(64px,20vw,170px)` |

#### Scenario: Token value matches its source literal

- GIVEN a typography token in `@theme`
- WHEN compared, as a string, to the literal it replaces
- THEN they are identical

### Requirement: Spacing Token Scale

The system MUST define 8 ordinal `--spacing-*` steps plus 3 functionally-named
section constants, all in `@theme`, each equal to an existing literal.

| Token | Value |
|---|---|
| `--spacing-3xs`…`-2xl` | 8 steps, `clamp(4px,1.5vw,8px)`…`clamp(24px,6vw,48px)` |
| `--spacing-section-gutter` | `clamp(16px,6vw,58px)` |
| `--spacing-section-top` | `clamp(44px,13vw,108px)` |
| `--spacing-hero-top` | `clamp(62px,17.5vw,90px)` |

`src/lib/layout.ts` MUST NOT be modified by this change. An earlier draft placed
the three section constants there, following the `FRAME_PADDING` pattern. That
was rejected in design decision D1 on evidence: all seven call sites consume
these values as Tailwind utility classes (`px-[ clamp(16px, 6vw, 58px) ]`,
`pt-[ … ]`), never as `style` attributes. Routing them through `layout.ts` would
force a class-to-inline-style mechanism change, raising specificity and losing
responsive variants, for no benefit. `layout.ts` exists for values composed
inside `calc()` in TypeScript template literals — a job `@theme` cannot do.

#### Scenario: Named constant matches its source literal

- GIVEN `--spacing-section-gutter` in the `@theme` block
- WHEN compared to `clamp(16px,6vw,58px)`
- THEN they are identical

#### Scenario: Layout module is untouched

- GIVEN the completed change
- WHEN `git diff` is inspected for `src/lib/layout.ts`
- THEN the diff is empty

### Requirement: Two-Stage Value-Preserving Invariant

Stage 1 MUST replace each literal with its token, unchanged in computed
value. Stage 2 ships separately: each near-duplicate merge is individually
listed, approved, and shows measured before/after pixels.

#### Scenario: Stage 1 substitution changes nothing computed

- GIVEN a call site's literal replaced by its token
- WHEN computed style is read at the 5 checked widths, before and after
- THEN values are identical at every width

#### Scenario: Stage 2 merge is isolated and documented

- GIVEN two near-duplicate values proposed for merge
- WHEN the merge ships
- THEN it appears in a before/after table, separate from Stage 1 substitutions

### Requirement: Title Size Contract

`Title` MUST replace `fontSize?: string` with `size?: TitleSize`, a closed
union of the 11 typography token names, so an invalid size fails the build.

#### Scenario: Invalid size is rejected

- GIVEN `<Title size="45px">`, not a `TitleSize` member
- WHEN `pnpm run build` runs
- THEN it fails on that call site

### Requirement: Escape Hatch for Genuine One-offs

A call site MAY bypass tokens via `class` for a genuine one-off, MUST carry an
adjacent comment explaining why no token applies.

#### Scenario: Documented one-off passes review

- GIVEN a value with no matching token and a stated reason
- WHEN passed via `class="text-[clamp(...)]"` with an adjacent comment
- THEN it is accepted without a new token

#### Scenario: Undocumented arbitrary value is rejected

- GIVEN an arbitrary `clamp()` value in `class` with no comment
- WHEN reviewed
- THEN it MUST be tokenized or documented before merge

### Requirement: Merge Decision Rule

Two values MAY merge only when minimum and `vw` slope match and maxima differ
by ≤2px. Differing slopes MUST NOT auto-merge. Any merge shifting size by
>1px at any checked width needs individual approval.

#### Scenario: Eligible pair merges

- GIVEN two values sharing minimum and slope, maxima differing by ≤2px
- WHEN merged
- THEN the shift at every width is ≤1px, or approval is recorded

#### Scenario: Differing slope stays separate

- GIVEN two values with different `vw` slopes
- WHEN evaluated for merge
- THEN they remain distinct tokens or arbitrary values

### Requirement: Geometry Exclusion Boundary

Decoration and element geometry (size/position of decorations, the polaroid
frame, countdown circles) MUST NOT be tokenized. Boundary: a `font-size`/
`gap`/`padding`/`margin` value is in scope; a `width`/`height`/`top`/`right`
fixing one asset's own shape stays arbitrary.

#### Scenario: Spacing value is tokenized

- GIVEN a `gap`/`padding` value shared by 2+ call sites
- WHEN classified
- THEN it is bound to a spacing token

#### Scenario: Decoration geometry stays untouched

- GIVEN a decoration's own `width`/`top` offset, unique to its call site
- WHEN classified
- THEN it remains an arbitrary value with no token

### Requirement: Visual-Identity Invariant

After tokenization, `/` and `/invitacion` MUST render with computed styles
identical to the pre-change build at the 5 checked widths — 360, 390, 768,
1024, 1440px — except values listed in a Stage 2 merge table. `pnpm run
build` MUST pass with no warning beyond the known `lila` contrast warning.

#### Scenario: Build has no new warnings

- GIVEN the tokenized codebase
- WHEN `pnpm run build` runs
- THEN the only warning is the known `lila` contrast warning

#### Scenario: Computed styles match across viewports

- GIVEN both pages, checked after a palette switch
- WHEN computed styles are compared at all 5 widths against the prior build
- THEN they match, except values listed in the Stage 2 merge table
