#!/usr/bin/env python3
"""Exact classical-error illustrations, not an empirical reanalysis.

Outcome: balanced randomized G, X=tau*G+V and W=X+U; iid independent
mean-zero (V,U) pairs, independent of assignment; Var(V)=1 and
Var(U)=(1-rho)/rho. Reliability rho is WITHIN arms. The raw difference in
means has mean tau and variance 4/(N*rho). Equal arms require even N.

Predictor: iid triples of independent zero-mean Gaussian (X,U,epsilon),
with variances 1, (1-rho)/rho, 1; W=X+U and Y=beta*X+epsilon. OLS with an
intercept targets beta, but has expectation rho*beta and unconditional
variance rho*[1+beta**2*(1-rho)]/(N-3), for N>3. Here rho is unconditional
predictor reliability. No reported alpha/agreement/correlation is equated
to rho without a measurement model. There is no significance selection.

Both illustrative effects are .2. Figure ratios compare each estimator's
RMSE to its own error-free version. The predictor baseline is unshrunk OLS;
matched shrinkage of error-free OLS is documented separately in the JSON.
Standardized-effect and correlation factors refer to population quantities,
not finite-sample estimator expectations.

Run from any directory with NumPy and Matplotlib installed. The linked
.house-style supplies the base style; lining numerals are used for ticks.
"""
from pathlib import Path
import hashlib
import json
import math
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".house-style"))
from plot_style import setup

EFFECT = 0.2
RHOS = (0.6, 0.9)


def moments(n, rho):
    if not isinstance(n, (int, np.integer)) or n <= 3 or n % 2:
        raise ValueError("Use an even integer N > 3 for both designs.")
    if not 0 < rho <= 1:
        raise ValueError("Use 0 < rho <= 1.")
    outcome_var = 4 / (n * rho)
    predictor_var = rho * (1 + EFFECT**2 * (1-rho)) / (n-3)
    predictor_bias = EFFECT * (rho-1)
    predictor_mse = predictor_var + predictor_bias**2
    clean_predictor_mse = 1 / (n-3)
    matched_shrinkage_mse = rho**2 / (n-3) + predictor_bias**2
    return {
        "n": int(n), "rho": rho,
        "outcome_mean": EFFECT, "outcome_bias": 0.0,
        "outcome_sd": math.sqrt(outcome_var),
        "outcome_rmse": math.sqrt(outcome_var),
        "predictor_mean": EFFECT*rho, "predictor_bias": predictor_bias,
        "predictor_sd": math.sqrt(predictor_var),
        "predictor_rmse": math.sqrt(predictor_mse),
        "outcome_effective_n": n*rho,
        "outcome_rmse_ratio": 1/math.sqrt(rho),
        "predictor_rmse_ratio": math.sqrt(predictor_mse/clean_predictor_mse),
        "predictor_error_free_mse": clean_predictor_mse,
        "predictor_matched_shrinkage_mse": matched_shrinkage_mse,
        "predictor_mse_excess_over_matched_shrinkage": predictor_mse-matched_shrinkage_mse,
        "population_standardized_difference_factor": math.sqrt(rho),
        "population_correlation_one_noisy_variable_factor": math.sqrt(rho),
    }


def main():
    figures = ROOT / "figures"
    figures.mkdir(exist_ok=True)
    rows = [moments(n, rho) for rho in RHOS for n in (50, 200, 1000)]
    result = {
        "kind": "exact moments under specified classical-error models",
        "effect": EFFECT,
        "outcome_reliability": "within-arm Var(V)/[Var(V)+Var(U)]",
        "predictor_reliability": "Var(X)/[Var(X)+Var(U)]",
        "latent_variance": 1,
        "learning_residual_variance": 1,
        "selection": "none",
        "figure_baseline": "same design and estimator with rho=1; predictor OLS unshrunk",
        "population_factors_are_not_estimator_expectations": True,
        "rows": rows,
        "predictor_comparisons": [moments(n, .6) for n in (20, 50, 64, 200, 1000, 10000)],
        "predictor_equal_mse_n": {
            str(rho): 3+(1-rho*EFFECT**2)/(EFFECT**2*(1-rho)) for rho in RHOS
        },
        "outcome_planning": {
            "target_units": "latent within-arm standard deviation, set to one",
            "assumptions": "known variances; balanced randomized groups; independent classical errors",
            "interval": "normal approximation, not an observed interval or a power calculation",
            "estimated_reliability_uncertainty_propagated": False,
            "hypothetical_estimated_contrast": EFFECT,
            "rows": [
                {
                    "n": n, "rho": rho,
                    "standard_error": moments(n, rho)["outcome_sd"],
                    "normal_95_half_width": 1.96*moments(n, rho)["outcome_sd"],
                    "hypothetical_interval": [
                        EFFECT-1.96*moments(n, rho)["outcome_sd"],
                        EFFECT+1.96*moments(n, rho)["outcome_sd"],
                    ],
                }
                for n, rho in ((200, .6), (200, .9), (300, .6))
            ],
        },
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }
    (ROOT / "analysis/measurement-consequences.json").write_text(json.dumps(result, indent=2)+"\n")
    setup(font_size=10, title_size=11, tick_size=9, legend_size=9)
    # Keep the house serif for prose, but use explicit lining numerals and
    # STIX math for all tick labels so 1000 cannot look like IO^3.
    plt.rcParams.update({"mathtext.fontset": "stix"})
    fig, axes = plt.subplots(1, 2, figsize=(7.4, 3.35), sharex=True, sharey=True)
    sizes = np.unique((2*np.round(np.geomspace(20, 10000, 180)/2)).astype(int))
    for rho, color, linestyle in zip(RHOS, ("#2E5077", "#A3392E"), ("-", "--")):
        values = [moments(n, rho) for n in sizes]
        for ax, key in zip(axes, ("outcome_rmse_ratio", "predictor_rmse_ratio")):
            ys = [v[key] for v in values]
            ax.plot(sizes, ys, color=color, linestyle=linestyle)
            ax.annotate(f"reliability {str(rho).removeprefix('0')}", (10000, ys[-1]),
                        xytext=(-4, 5), textcoords="offset points",
                        ha="right", fontsize=9, color=color, fontfamily="STIXGeneral")
    axes[0].set_title("(a) Randomized raw mean contrast")
    axes[1].set_title("(b) Uncorrected latent slope")
    axes[0].set_ylabel("RMSE / error-free RMSE (log scale)")
    for ax in axes:
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.set_xlim(20, 10000)
        ax.set_ylim(.78, 9)
        ax.xaxis.set_major_locator(FixedLocator([20, 100, 1000, 10000]))
        ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:,.0f}"))
        ax.yaxis.set_major_locator(FixedLocator([1, 2, 4, 8]))
        ax.yaxis.set_major_formatter(FuncFormatter(lambda y, _: f"{y:g}"))
        ax.xaxis.set_minor_locator(NullLocator())
        ax.yaxis.set_minor_locator(NullLocator())
        ax.axhline(1, color="#555555", linewidth=.8, linestyle=":", zorder=0)
        ax.set_xlabel("Total sample size, N (log scale)")
        for label in ax.get_xticklabels()+ax.get_yticklabels():
            label.set_fontfamily("STIXGeneral")
    axes[0].text(24, .87, "1 = equal RMSE", fontsize=8, color="#444444", fontfamily="STIXGeneral")
    fig.tight_layout(w_pad=1.3)
    for ext in ("pdf", "png", "svg"):
        fig.savefig(figures / ("measurement-consequences."+ext), dpi=300)
    plt.close(fig)
    print("Exact moments, comparison ratios, and PDF/PNG/SVG figure written.")


if __name__ == "__main__":
    main()
