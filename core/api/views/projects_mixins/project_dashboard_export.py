from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action

from core.api.export.projects_dashboard_dump import ProjectsDashboardDump


class ProjectDashboardExportMixin:
    @extend_schema(
        description="""
        Export all projects as an Excel workbook (.xlsx) with five sheets
        (Projects, Substances, Funds, Global fields, MetaProjects) ready for
        Power BI or similar tools.

        All transformations are applied server-side: filtering to latest versions,
        excluding production projects, substance type cleanup, geographic enrichment
        (country_iso, Region, Sub-Region), and optional mock data filling for
        impact metrics.

        See docs/dashboard_export.md for full parameter documentation.
        """,
        parameters=[
            OpenApiParameter(
                name="latest_only",
                location=OpenApiParameter.QUERY,
                description="Keep only the latest version of each project. Default: true.",
                type=OpenApiTypes.BOOL,
                default=True,
            ),
            OpenApiParameter(
                name="exclude_production",
                location=OpenApiParameter.QUERY,
                description="Exclude production-sector projects. Default: true.",
                type=OpenApiTypes.BOOL,
                default=True,
            ),
            OpenApiParameter(
                name="fill_substance_type",
                location=OpenApiParameter.QUERY,
                description="Fill blank substance_type values with 'HFC'. Default: false.",
                type=OpenApiTypes.BOOL,
                default=False,
            ),
            OpenApiParameter(
                name="merge_methyl_bromide",
                location=OpenApiParameter.QUERY,
                description="Reclassify 'Methyl Bromide' substance_type as 'CFC'. Default: false.",
                type=OpenApiTypes.BOOL,
                default=False,
            ),
            OpenApiParameter(
                name="mock_data",
                location=OpenApiParameter.QUERY,
                description=(
                    "Fill impact-metric columns with plausible random values proportional "
                    "to project funding. Intended for dashboard mockups before real data is "
                    "available. Default: true."
                ),
                type=OpenApiTypes.BOOL,
                default=True,
            ),
            OpenApiParameter(
                name="mock_types",
                location=OpenApiParameter.QUERY,
                description=(
                    "Comma-separated substance types to apply mock data to "
                    "(hfc, hcfc, cfc). Only used when mock_data=true. Default: hfc,hcfc,cfc."
                ),
                type=OpenApiTypes.STR,
                default="hfc,hcfc,cfc",
            ),
            # Not exposing mock seed parameter to Swagger UI, not needed
            # OpenApiParameter(
            #     name="mock_seed",
            #     location=OpenApiParameter.QUERY,
            #     description="RNG seed for reproducible mock data. Default: 42.",
            #     type=OpenApiTypes.INT,
            #     default=42,
            # ),
        ],
    )
    @action(methods=["GET"], detail=False, url_path="dashboards/all")
    def dashboards_all(self, request, *args, **kwargs):
        return ProjectsDashboardDump(self).export()
