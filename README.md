# What Generalizes in Reliability Generalization?

Brett Reynolds, Humber Polytechnic & University of Toronto. Preprint, November 2026.

A short methods response to Shujing Zhao and Luke Plonsky, "A reliability generalization meta-analysis in task engagement research", *Research Methods in Applied Linguistics* 5 (2026), 100386, https://doi.org/10.1016/j.rmal.2026.100386.

## Abstract

Zhao and Plonsky's synthesis of task-engagement research uses a distribution of reported reliability coefficients to assess measurement quality and discuss minimum acceptability. Such judgments require more than a position in that distribution. As the authors note, the pooled coefficients don't all summarize the same measurement property, and even comparable coefficients have different consequences for different scientific targets. Using the synthesis as a worked case, this response connects the authors' cautions about coefficient choice to their rationale for a percentile benchmark. Under explicit classical-error models, reliability of .6 leaves a randomized raw mean contrast unbiased but reduces its effective sample size to 60% of the original. An uncorrected slope on a noisy predictor instead converges to 60% of the latent slope. Standardized differences and correlations require further distinctions. These familiar results show why a field percentile alone can't tell a researcher what a planned study can learn. A worked planning example shows how, under the stated model, reliability and sample size together set the precision of an experimental contrast. Reliability syntheses can better support such decisions by displaying comparable coefficients separately and connecting them to uncertainty about specified estimates and predictions.

## Contents

| Path | What it holds |
|---|---|
| `reliability-generalization-response.pdf` | The paper |
| `reliability-generalization-response.tex` | Its LaTeX source |
| `references-standalone.bib` | The cited bibliography entries |
| `analysis/` | The script that computes Table 2, Figure 1 and the planning example, and its JSON output |
| `figures/` | Figure 1 in PDF, PNG and SVG |
| `supplement/` | Source and standalone build of the interactive supplement on correlation and agreement |

The supplement is also online at https://brettreynolds.ca/correlation-and-agreement/. To use it offline, open `supplement/dist/index.html` in a browser; `supplement/README.md` explains how to build and verify it.

## Building the paper

The paper uses the author's LaTeX house style, which is public. Clone it into `.house-style` at the commit this version was built with:

```sh
git clone https://github.com/BrettRey/reliability-generalization-response
cd reliability-generalization-response
git clone https://github.com/BrettRey/house-style .house-style
git -C .house-style checkout e71f7bf9ca88e9c4bc010a3931a6157ab886e689
make
```

The build needs XeLaTeX and Biber (TeX Live supplies both, and the EB Garamond fonts). If the figure is missing or older than the script, `make` regenerates it, which needs Python 3 with NumPy and Matplotlib. `make analysis` regenerates the JSON and the figure explicitly.

## License

[CC BY 4.0](LICENSE).

## Citation

Reynolds, Brett. 2026. What generalizes in reliability generalization? Preprint.
