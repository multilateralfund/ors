"""
The Dashboard Metrics endpoints.
"""

from django.core.cache import cache
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import renderers, views
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.api.dashboard_metrics import (
    get_country_index,
    get_country_metrics,
    get_fund_metrics,
)
from core.api.export.dashboard_metrics_export import DashboardMetricsExport
from core.api.serializers.dashboard_metrics import (
    DashboardCountryIndexSerializer,
    DashboardCountryMetricsEnvelopeSerializer,
    DashboardMetricsEnvelopeSerializer,
)

APR_PARAMETERS = [
    OpenApiParameter(
        name="apr_year",
        type=int,
        description=(
            "APR reporting cycle. Defaults to the newest endorsed cycle, "
            "falling back to the newest cycle with data."
        ),
    ),
]

PLACEHOLDER_PARAMETERS = [
    OpenApiParameter(
        name="placeholders",
        type=bool,
        description=(
            "Serve invented stand-in values for the datapoints that have no "
            "source yet, so a page can be rendered end to end before its data "
            "exists. Defaults to false. Every invented value is marked with "
            '"placeholder": true and must not be published.'
        ),
    ),
]


class _WorkbookRenderer(renderers.BaseRenderer):
    """Declared so ``?format=xlsx`` survives DRF's content negotiation.

    ``format`` is DRF's own renderer-selection parameter, so a value it does
    not recognise 404s before the view runs. Both responses are built whole by
    the exporter, so neither renderer is ever asked to render anything.
    """

    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    format = "xlsx"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class _PageRenderer(_WorkbookRenderer):
    """The same, for ``?format=html``."""

    media_type = "text/html"
    format = "html"


EXPORT_FORMATS = ("xlsx", "html")

FORMAT_PARAMETERS = [
    OpenApiParameter(
        name="format",
        type=str,
        enum=list(EXPORT_FORMATS),
        description=(
            "`xlsx` downloads a workbook, the default. `html` renders the same "
            "figures as a page, for reading in the browser without a "
            "spreadsheet."
        ),
    ),
]

TRUTHY = {"true", "1", "yes"}
FALSY = {"false", "0", "no"}


def parse_placeholders(request: Request) -> bool:
    """``?placeholders=<bool>``, defaulting to off, or a 400."""
    raw = request.query_params.get("placeholders")
    if raw in (None, ""):
        return False
    normalised = raw.strip().lower()
    if normalised in TRUTHY:
        return True
    if normalised in FALSY:
        return False
    raise ValidationError({"placeholders": f"Expected true or false, got {raw!r}."})


def parse_export_format(request: Request) -> str:
    """``?format=xlsx|html``, defaulting to the workbook, or a 400."""
    raw = request.query_params.get("format")
    if raw in (None, ""):
        return "xlsx"
    normalised = raw.strip().lower()
    if normalised in EXPORT_FORMATS:
        return normalised
    raise ValidationError(
        {"format": f"Expected one of {', '.join(EXPORT_FORMATS)}, got {raw!r}."}
    )


def parse_apr_year(request: Request) -> int | None:
    """``?apr_year=<int>``, or a 400."""
    raw_year = request.query_params.get("apr_year")
    if raw_year in (None, ""):
        return None
    try:
        return int(raw_year)
    except ValueError as exc:
        raise ValidationError(
            {"apr_year": f"Expected an integer year, got {raw_year!r}."}
        ) from exc


class DashboardMetricsFundView(views.APIView):
    """
    Fund-wide "Our Work" figures.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="dashboard_metrics_fund",
        parameters=APR_PARAMETERS + PLACEHOLDER_PARAMETERS,
        responses=DashboardMetricsEnvelopeSerializer,
    )
    def get(self, request: Request, *args, **kwargs) -> Response:
        return Response(
            get_fund_metrics(
                apr_year=parse_apr_year(request),
                placeholders=parse_placeholders(request),
            )
        )


class DashboardMetricsCountryIndexView(views.APIView):
    """
    Every entry the per-country route can address: countries keyed on iso3,
    aggregate regions keyed on abbr.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="dashboard_metrics_countries",
        responses=DashboardCountryIndexSerializer,
    )
    def get(self, *args, **kwargs) -> Response:
        return Response(get_country_index())


class DashboardMetricsCountryView(views.APIView):
    """
    Per-country profile figures for one country or region.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="dashboard_metrics_country",
        parameters=APR_PARAMETERS + PLACEHOLDER_PARAMETERS,
        responses=DashboardCountryMetricsEnvelopeSerializer,
    )
    def get(self, request: Request, key: str, *args, **kwargs) -> Response:

        apr_year = parse_apr_year(request)
        placeholders = parse_placeholders(request)

        # include user identity/perm-relevant bits if output varies by user
        user_part = f"user:{getattr(request.user, 'id', 'anon')}"
        # short stable cache key; include placeholders / apr_year so different requests cache separately
        cache_key = f"dashboard:country:{key}:apr={apr_year}:ph={int(bool(placeholders))}:{user_part}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        payload = get_country_metrics(
            key,
            apr_year=apr_year,
            placeholders=placeholders,
        )
        if payload is None:
            raise NotFound(
                f"No dashboard entry with key {key!r}. Keys are iso3 for "
                f"countries and abbr for regions; see /countries/."
            )

        cache.set(cache_key, payload, timeout=60 * 60)

        return Response(payload)


class DashboardMetricsExportView(views.APIView):
    """
    Both pages' figures as a workbook: one sheet for the fund, one for every
    country, a row per figure and a column to write review notes in.

    ``?format=html`` serves the same figures as a page instead, so anyone with
    a login can read them in the browser without downloading anything.
    """

    permission_classes = [IsAuthenticated]
    renderer_classes = [_WorkbookRenderer, _PageRenderer]

    @extend_schema(
        operation_id="dashboard_metrics_export",
        parameters=APR_PARAMETERS + PLACEHOLDER_PARAMETERS + FORMAT_PARAMETERS,
        responses={200: OpenApiResponse(OpenApiTypes.BINARY, "Workbook or page")},
    )
    def get(self, request: Request, *args, **kwargs) -> Response:
        export = DashboardMetricsExport(
            apr_year=parse_apr_year(request),
            placeholders=parse_placeholders(request),
        )
        if parse_export_format(request) == "html":
            return export.export_html()
        return export.export_xls()
