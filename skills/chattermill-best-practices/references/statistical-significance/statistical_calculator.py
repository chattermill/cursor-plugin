#!/usr/bin/env python3
"""
Statistical Calculator for Chattermill Comparisons
A lightweight calculator that can be invoked to calculate p-values and significance
"""

import math
import json
import sys
from typing import Dict, Tuple, Any

class StatisticalCalculator:
    """Simple calculator for statistical significance testing."""

    def __init__(self, confidence_level: float = 0.1):
        self.confidence_level = confidence_level

    def calculate_z_test_proportions(self, p1: float, p2: float, n1: int, n2: int) -> Dict[str, Any]:
        """
        Calculate z-test for comparing two proportions.

        Example: Satisfaction rate 75% vs 70% with n=1000 each
        """
        # Convert to proportions if percentages
        if p1 > 1:
            p1 = p1 / 100
        if p2 > 1:
            p2 = p2 / 100

        # Pooled proportion
        p_pooled = (p1 * n1 + p2 * n2) / (n1 + n2)

        # Standard error
        if p_pooled == 0 or p_pooled == 1:
            return {"p_value": 1.0, "significant": False, "test": "z-test"}

        se = math.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2))

        if se == 0:
            return {"p_value": 1.0, "significant": False, "test": "z-test"}

        # Z-score
        z = (p1 - p2) / se

        # Approximate p-value using normal distribution
        # For simplicity, using approximation
        p_value = 2 * (1 - self._normal_cdf(abs(z)))

        return {
            "z_score": z,
            "p_value": round(p_value, 4),
            "significant": p_value <= self.confidence_level,
            "test": "z-test for proportions"
        }

    def calculate_t_test(self, mean1: float, mean2: float, std1: float, std2: float,
                        n1: int, n2: int) -> Dict[str, Any]:
        """
        Calculate Welch's t-test for comparing two means.

        Example: NPS 25 vs 20 with std_dev=15 and n=1000 each
        """
        # Standard error
        se = math.sqrt((std1**2 / n1) + (std2**2 / n2))

        if se == 0:
            return {"p_value": 1.0, "significant": False, "test": "t-test"}

        # T-statistic
        t = (mean1 - mean2) / se

        # Degrees of freedom (Welch's correction)
        df = ((std1**2/n1 + std2**2/n2)**2) / \
             ((std1**2/n1)**2/(n1-1) + (std2**2/n2)**2/(n2-1))

        # Approximate p-value
        # Using simplified approximation for t-distribution
        p_value = self._t_distribution_p_value(abs(t), df)

        return {
            "t_statistic": round(t, 3),
            "degrees_of_freedom": round(df, 1),
            "p_value": round(p_value, 4),
            "significant": p_value <= self.confidence_level,
            "test": "Welch's t-test"
        }

    def check_threshold(self, current: float, previous: float, metric_type: str) -> Dict[str, Any]:
        """
        Simple threshold check for 0→X comparisons.

        Example: New issue with 0→6 mentions
        """
        if previous != 0:
            return {"error": "Use statistical test for non-zero baseline"}

        thresholds = {
            "daily": 3,
            "weekly": 5,
            "monthly": 10,
            "quarterly": 20
        }

        period = metric_type if metric_type in thresholds else "weekly"
        threshold = thresholds[period]

        return {
            "current_value": current,
            "threshold": threshold,
            "significant": current >= threshold,
            "test": "threshold_check"
        }

    def _normal_cdf(self, z: float) -> float:
        """Approximate normal CDF using error function."""
        return 0.5 * (1 + math.erf(z / math.sqrt(2)))

    def _t_distribution_p_value(self, t: float, df: float) -> float:
        """
        Approximate p-value for t-distribution.
        Using simplified approximation.
        """
        # For large df, t-distribution approaches normal
        if df > 30:
            return 2 * (1 - self._normal_cdf(t))

        # Simplified approximation for smaller df
        # This is not exact but good enough for filtering
        adjustment = 1 + (1 / (4 * df)) + (1 / (32 * df**2))
        adjusted_t = t / adjustment
        return 2 * (1 - self._normal_cdf(adjusted_t))

    def calculate(self, comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for calculating significance.

        Input format:
        {
            "type": "proportion|mean|threshold",
            "current": {"value": X, "n": N, "std": S},
            "previous": {"value": Y, "n": M, "std": T},
            "metric": "nps|sentiment|satisfaction|volume"
        }
        """
        test_type = comparison_data.get("type", "auto")
        current = comparison_data["current"]
        previous = comparison_data["previous"]

        # Auto-detect test type if not specified
        if test_type == "auto":
            if previous["value"] == 0:
                test_type = "threshold"
            elif comparison_data.get("metric") in ["satisfaction", "conversion", "rate"]:
                test_type = "proportion"
            else:
                test_type = "mean"

        # Apply appropriate test
        if test_type == "threshold":
            return self.check_threshold(
                current["value"],
                previous["value"],
                comparison_data.get("period", "weekly")
            )
        elif test_type == "proportion":
            return self.calculate_z_test_proportions(
                current["value"], previous["value"],
                current["n"], previous["n"]
            )
        else:  # mean
            return self.calculate_t_test(
                current["value"], previous["value"],
                current.get("std", current["value"] * 0.3),
                previous.get("std", previous["value"] * 0.3),
                current["n"], previous["n"]
            )


def main():
    """
    Command-line interface for the calculator.

    Usage:
    echo '{"type": "mean", "current": {"value": 25, "n": 1000, "std": 15},
           "previous": {"value": 20, "n": 1000, "std": 14}}' | python statistical_calculator.py
    """
    if len(sys.argv) > 1:
        # Read from command line argument
        data = json.loads(sys.argv[1])
    else:
        # Read from stdin
        data = json.loads(sys.stdin.read())

    calculator = StatisticalCalculator()
    result = calculator.calculate(data)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()