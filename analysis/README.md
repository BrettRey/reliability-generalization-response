# Analysis

`measurement-consequences.py` computes the paper's classical-error illustrations:
- the attenuation factors in Table 2;
- the RMSE ratios plotted in Figure 1;
- the planning example's standard errors and interval half-widths;
- the sample size at which the noisy and error-free slope estimators have equal MSE (Appendix A.3).

These are exact model consequences, not a reanalysis of empirical data. The model assumptions are stated at the top of the script and in Appendix A.

Run it from the repository root with Python 3, NumPy and Matplotlib, and with the house style cloned into `.house-style` (see the main README):

```sh
python3 analysis/measurement-consequences.py
```

It writes `measurement-consequences.json` here and the figure to `../figures/`. The JSON records the SHA-256 of the script that produced it. Before posting, a second model (GPT-6 in OpenAI Codex) independently recomputed the table values, standard errors, interval half-widths and crossing reported in the paper from this JSON and the stated formulas, and found no mismatches.
