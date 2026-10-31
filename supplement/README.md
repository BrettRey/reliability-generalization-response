# Same scores, different summaries

Open [the standalone page](dist/index.html) directly in a browser. It contains
all required HTML, CSS, JavaScript, and graphics. Its download link produces
another self-contained copy, including when the page is opened from a local file.
Current counts and saved snapshots last for the current page session; switching
views preserves them, while reloading starts a fresh example.

The page uses four constructed event-count pairs. Observer A is fixed at
1, 2, 3, 4, and B has integer values from 1 to 7. It demonstrates properties of
Pearson correlation and exact agreement, with an optional within-one rule.
It supplies no empirical engagement data or probability model over the examples.

Build and check from the repository root:

```sh
python3 supplement/build.py
python3 supplement/verify.py
```

The build requires Python's standard library. Verification also requires Node
and independently checks the JavaScript calculations using Python's standard
library and exact fractions. No package installation is required.

`src/core.js` contains pure calculations; `src/app.js` handles the interface;
`src/page.html` and `src/style.css` define the presentation. `dist/manifest.json`
records the version and source/output hashes. Edit the sources and rebuild,
rather than editing the generated HTML.

Version 1.0.0 implements Brett's approved design. Claude Opus 5.5 (with additional
reported Claude Fable 5.1 usage) and Muse Wonder Full 1.0 supplied design
consultations; Codex implemented the page and a separate Codex agent checked its
mathematics and code. These consultations are not evidence of teaching efficacy.

The supplement is public at [brettreynolds.ca/correlation-and-agreement/](https://brettreynolds.ca/correlation-and-agreement/)
as of 31 October 2026, linked from the homepage's Resources navigation and
Teaching and research resources section. The website copy matches the checked
standalone build. Archival deposit and a public manuscript link remain open.
See [validation](VALIDATION.md) for completed checks and remaining testing limits.
