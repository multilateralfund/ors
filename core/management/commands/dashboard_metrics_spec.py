"""
Render the dashboard metric registry as markdown for review.

    ./manage.py dashboard_metrics_spec > dashboard_metrics.md
"""

from collections.abc import Sequence

from django.core.management.base import BaseCommand

from core.api.dashboard_metrics.country import COUNTRY_METRICS
from core.api.dashboard_metrics.fund import FUND_METRICS
from core.api.dashboard_metrics.registry import Metric

COLUMNS = (
    "metric_id",
    "Label",
    "Section",
    "Kind",
    "Unit",
    "Disposition",
    "Formula",
    "Source",
    "Model field",
    "Built",
)


def _cell(value: str) -> str:
    """Escape a value so it cannot break out of a markdown table row."""
    return str(value).replace("|", "\\|").replace("\n", " ")


def _row(metric: Metric) -> str:
    return (
        "| "
        + " | ".join(
            _cell(value)
            for value in (
                f"`{metric.metric_id}`",
                metric.label,
                metric.section,
                metric.kind.value,
                metric.unit.value if metric.unit else "",
                metric.disposition.value,
                metric.formula,
                metric.db_source,
                metric.src_model_field,
                "yes" if metric.compute else "no",
            )
        )
        + " |"
    )


def _table(title: str, metrics: Sequence[Metric]) -> list[str]:
    lines = [f"## {title} ({len(metrics)})", ""]
    lines.append("| " + " | ".join(COLUMNS) + " |")
    lines.append("|" + "---|" * len(COLUMNS))
    lines.extend(_row(metric) for metric in metrics)
    lines.append("")
    return lines


class Command(BaseCommand):
    help = "Render the dashboard metric registry as markdown."

    def handle(self, *args, **options):
        built = sum(1 for m in FUND_METRICS + COUNTRY_METRICS if m.compute is not None)
        total = len(FUND_METRICS) + len(COUNTRY_METRICS)

        lines = [
            "# Dashboard metrics",
            "",
            f"{total} metrics, {built} implemented.",
            "",
            *_table("Fund-wide", FUND_METRICS),
            *_table("Per-country", COUNTRY_METRICS),
        ]
        for line in lines:
            self.stdout.write(line)
