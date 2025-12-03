from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_v2 import ProjectListV2Serializer
from core.models.project import Project
from core.models.project_metadata import ProjectSpecificFields


class ProjectListPreviousTranchesMixin:
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_validation",
                openapi.IN_QUERY,
                description="If set to true, the response will include validation information for the projects.",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "tranche",
                openapi.IN_QUERY,
                description="""
                    The new tranche number given to the project.
                    Used to filter previous tranches.
                    If not provided, tranche will be used from the project.
                """,
                type=openapi.TYPE_INTEGER,
            ),
        ],
        operation_description="List previous tranches of the project.",
    )
    @action(methods=["GET"], detail=True)
    def list_previous_tranches(self, request, *args, **kwargs):
        """
        List previous tranches of the project.
        This is used to get the previous tranche for the project.
        """
        project = self.get_object()
        if not request.query_params.get("tranche"):
            # If tranche is not provided, use the tranche from the project
            tranche = project.tranche
        else:
            tranche = request.query_params.get("tranche")
        try:
            tranche = int(tranche)
        except (ValueError, TypeError):
            previous_tranches = Project.objects.none()
        else:
            previous_tranches = (
                Project.objects.all()
                .exclude(
                    id=project.id,
                )
                .filter(
                    country=project.country,
                    cluster=project.cluster,
                    tranche=tranche - 1,
                    submission_status__name="Approved",
                )
            )
            previous_tranches = previous_tranches.select_related(
                "agency",
                "country",
                "project_type",
                "status",
                "submission_status",
                "sector",
            ).prefetch_related(
                "coop_agencies",
                "subsectors",
                "funds",
                "comments",
                "files",
                "subsectors__sector",
            )

        context = self.get_serializer_context()
        if request.query_params.get("include_validation", "false").lower() == "true":
            # Include validation information for each project
            data = []
            for previous_tranche in previous_tranches:
                serializer_data = ProjectListV2Serializer(
                    previous_tranche, context=context
                ).data
                warnings = []
                errors = []
                specific_field = ProjectSpecificFields.objects.filter(
                    cluster=previous_tranche.cluster,
                    type=previous_tranche.project_type,
                    sector=previous_tranche.sector,
                ).first()
                errors = []
                warnings = []
                if (
                    specific_field
                    and (
                        fields := specific_field.fields.filter(is_actual=True)
                    ).exists()
                ):
                    one_field_filled = False
                    for field in fields:
                        if getattr(previous_tranche, field.read_field_name) is not None:
                            one_field_filled = True
                        else:
                            warnings.append(
                                {
                                    "field": field.read_field_name,
                                    "message": f"{field.label} is not filled.",
                                }
                            )
                    if not one_field_filled:
                        errors.append(
                            {
                                "field": "fields",
                                "message": "At least one actual indicator should be filled.",
                            }
                        )
                serializer_data["warnings"] = warnings
                serializer_data["errors"] = errors
                data.append(serializer_data)
            return Response(data, status=status.HTTP_200_OK)
        return Response(
            ProjectListV2Serializer(previous_tranches, many=True, context=context).data,
            status=status.HTTP_200_OK,
        )
