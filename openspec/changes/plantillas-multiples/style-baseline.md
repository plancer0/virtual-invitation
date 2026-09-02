# Computed-style baseline

Captured from commit `c17c1ee` (before any tokenization), served with
`astro preview`. This is the reference for the visual-identity invariant: after
Stage 1, every hash below must be unchanged.

Screenshots were deliberately not used. What must be preserved is the computed
value on each element, and a hash of that is exact, diffable and cheap —
whereas comparing images is neither.

## What is measured

For every element under `<body>`, its DOM index path plus twelve computed
properties: `fontSize`, the four `padding*`, the four `margin*`, `gap`,
`rowGap`, `columnGap`. The lines are joined and hashed (djb2).

The DOM path is the point. `css-identity.mjs` proves the set of declaration
values is unchanged; it cannot prove the right value reached the right element.
This closes that gap, because a value landing on the wrong node changes its
path's line and therefore the hash.

## Baseline hashes

| Page | 360 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| `/` (12 elements) | `e1f42d60` | `c7ef20eb` | `551b6426` | `dfff5055` | `dfff5055` |
| `/invitacion` (214 elements) | `6dc4cc0e` | `abc3b698` | `83a9ab07` | `0f2e4ec8` | `74ef39b9` |

Note the cover page produces an identical hash at 1024 and 1440: every
`clamp()` on it is already pinned to its maximum by 1024, so the wider viewport
tests nothing new. `/invitacion` still differs between the two, so both are
kept there. This is the measured form of the design's D6 observation that 360
and 390 are the load-bearing widths.

## How to re-measure

Serve the build (`pnpm run preview`), then run this in the page console at each
width. Compare the printed hash against the table.

```js
window.__medir = () => {
  const props = ["fontSize", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
                 "marginTop", "marginRight", "marginBottom", "marginLeft", "gap", "rowGap", "columnGap"];
  const lines = [];
  const path = (el) => {
    const p = []; let n = el;
    while (n && n !== document.body) {
      p.unshift(n.tagName + [...n.parentNode.children].indexOf(n));
      n = n.parentElement;
    }
    return p.join(">");
  };
  for (const el of document.body.querySelectorAll("*")) {
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    const cs = getComputedStyle(el);
    lines.push(path(el) + "|" + props.map((p) => cs[p]).join(","));
  }
  const text = lines.join("\n");
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return { count: lines.length, hash: h.toString(16), text };
};
const r = window.__medir();
({ width: innerWidth, elements: r.count, hash: r.hash });
```

When a hash differs, re-run with `r.text` on both builds and diff the lines to
find which element moved. The element count must also match: a changed count
means the DOM structure moved, which invalidates the path comparison and has to
be understood before trusting any hash.
