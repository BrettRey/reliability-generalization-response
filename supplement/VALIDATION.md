# Supplement validation, 31 October 2026

Version **1.0.0** is implemented locally at [dist/index.html](dist/index.html).
Its source hashes are in [the manifest](dist/manifest.json), and the current
numerical result is in [verification.json](verification.json).

## Completed checks

- Independent Python verification covers all **2,401** allowed B vectors,
  using `statistics.correlation` and exact `Fraction` arithmetic. It checks
  every displayed ledger contribution, both agreement rules, exact labels,
  perfect correlations, undefined cases, and 2,401 pairwise equality comparisons.
  Eight invalid vectors are rejected.
- Enumeration gives 5 vectors with r = 1, 5 with r = −1, 7 with undefined r,
  216 with exactly two matches, and 1 with four matches. The application assigns
  no probabilities to these possibilities.
- A separate Codex agent independently checked the new manuscript formulas,
  table, engine, and interface code. It confirmed the mathematics and identified
  an overstatement of information loss plus invalid-input and focus bugs. These
  were corrected: zero/four-match exceptions are explicit, editing another field
  preserves an unresolved invalid input, and removing the last saved example
  returns focus to Save. A further local correction preserves focus when saving
  fills both snapshot slots.
- Native Chrome checks exercised the one-count shift, the constant-count case,
  the optional within-one rule, shared state across views, selected-clip
  arithmetic, saved snapshots, invalid-input recovery, removal focus, and all
  three construction tasks. The two-match examples visibly gave exact +.8 and
  −.8. Arrow-key navigation between activity tabs worked.
- Desktop and **320 CSS pixel** layouts were visually inspected. The narrow
  display retains the editable counts before the plot and keeps the summary
  visible while scrolling. Long calculation/comparison tables have their own
  scrolling regions. Native Chrome's accessibility tree exposes names, values,
  match text, calculation tables, and update announcements.
- The download completed as a 49,378-byte HTML file. Its script and style blocks
  match the canonical build and it has no external asset dependencies. Opening
  the downloaded file directly in Chrome initialized the application, and the
  shift and keyboard tab navigation worked from that local file. The preview
  server was then stopped. The final checked page had no console errors; an
  earlier missing favicon request was removed by an inline empty icon.

The browser connector reported that its access host was unavailable. These UI
checks used native Chrome control, rather than assuming connector success.

## Manuscript

The self-contained three-row table and the Pearson/exact-agreement formulas
replace the earlier kappa illustration. The backward-inference paragraph
preserves the 100% exact-agreement exception. No new empirical claim is made.

The full XeLaTeX/Biber build passed and all eight pages were rendered and inspected.
The new example is on page 3. There are no overfull/underfull boxes or unresolved
references; the pre-existing microtype footnote-patch warning remains.
TeXcount reports 2,487 main-file text words, 48 heading words, and 87 caption/other
words, excluding the bibliography and the preamble's macro definitions.
The appendix, classical-error numerical JSON, and set of ten citation keys are
unchanged. The house-style checker found no violations.

## Limits

This is a checked implementation, not a user study or a WCAG compliance finding.
Intended-reader testing, a complete keyboard-only traversal, actual touch-device
testing, VoiceOver/NVDA testing, and a separate 400% browser-zoom check remain
outstanding. The narrow-width check is not represented as all of those tests.
The public deployment is recorded below; there is no archival deposit URL.

## Website publication, 31 October 2026

Published at [brettreynolds.ca/correlation-and-agreement/](https://brettreynolds.ca/correlation-and-agreement/)
in website commit `8665db4cfe8fdca91432553724ac31464c65b82e`. The homepage
adds a Resources navigation link and a descriptive entry; the sitemap includes
the supplement. The page has a descriptive title, canonical URL, sharing
metadata, and a return link to the homepage's resource section.

The rebuilt standalone page passes the existing 2,401-vector numerical check.
Public HTTPS responses for the page, homepage, and sitemap return 200 and match
their committed files byte for byte. The supplement is 50,030 bytes, SHA-256
`36689aead4e008a07fcdc699c0c692dcfa64a630d65c7bb186f17ed3019f310d`.
Native Safari verified the live navigation and one-count shift: correlation
remains exactly 1 while exact matches fall from 4/4 to 0/4. The homepage entry
and live interactive were visually inspected. This publication changes metadata
and navigation, with no changes to the calculation or interface scripts.

The website's existing local `STATUS.md` edits were preserved. The manuscript
and novelty search were not edited as part of publication.
