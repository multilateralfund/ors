from django.db.models import Exists, OuterRef, Q, QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.filters.project_completion_report import (
    PCRProjectFilter,
    project_has_cooperating_agency_q,
)
from core.api.permissions import (
    DenyAll,
    HasProjectV2EditAccess,
    HasProjectV2ViewAccess,
)
from core.api.serializers.project_completion_report import (
    PCRCreateSerializer,
    PCRProjectListSerializer,
    PCRUpdateSerializer,
)
from core.api.views.utils import get_country_regions
from core.models.country import Country
from core.models.project import Project
from core.models.project_completion_report import PCR, PCRProject


class PCRProjectViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
):
    serializer_class = PCRProjectListSerializer
    filterset_class = PCRProjectFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering = ["-date_created"]
    ordering_fields = [
        "project__metacode",
        "project__country__name",
        "project__lead_agency__name",
        "project__cluster__name",
        "project__project_type__name",
        "project__sector__name",
        "project__title",
        "date_created",
    ]
    search_fields = [
        "project__code",
        "project__legacy_code",
        "project__metacode",
        "project__title",
    ]

    @property
    def permission_classes(self):
        if self.action in ["list", "list_filters"]:
            return [HasProjectV2ViewAccess]
        if self.action in ["create", "update", "partial_update"]:
            return [HasProjectV2EditAccess]
        return [DenyAll]

    def get_serializer_class(self):
        if self.action == "create":
            return PCRCreateSerializer
        if self.action in ["update", "partial_update"]:
            return PCRUpdateSerializer
        return PCRProjectListSerializer

    def filter_queryset(self, queryset):
        if self.action in ["update", "partial_update"]:
            return queryset
        return super().filter_queryset(queryset)

    def _filter_project_permissions_queryset(self, queryset):
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.is_mlfs_user"):
            queryset = queryset.exclude(project__submission_status__name="Draft")

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(project__production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset
        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(project__agency=user.agency)
                | (
                    Q(project__lead_agency=user.agency)
                    & Q(project__lead_agency__isnull=False)
                )
            )

        return queryset.none()

    def get_queryset(self):
        if self.action in ["update", "partial_update"]:
            return PCR.objects.select_related("meta_project").prefetch_related(
                "pcr_projects"
            )

        pcr_required_project = Project.objects.filter(
            pk=OuterRef("project_id")
        ).pcr_required()
        queryset = (
            PCRProject.objects.select_related(
                "pcr",
                "project",
                "project__country",
                "project__country__parent",
                "project__country__parent__parent",
                "project__agency",
                "project__lead_agency",
                "project__cluster",
                "project__project_type",
                "project__sector",
            )
            .prefetch_related(
                "project__subsectors",
            )
            .annotate(pcr_due_value=Exists(pcr_required_project))
        )
        return self._filter_project_permissions_queryset(queryset)

    @staticmethod
    def _get_regions(queryset: QuerySet[PCRProject]):
        countries = (
            Country.objects.filter(
                id__in=queryset.values_list("project__country_id", flat=True)
            )
            .order_by("name")
            .distinct()
        )
        regions = get_country_regions()
        result = []
        for country in countries:
            result.append(
                regions.get(country.id, {"id": country.id, "name": country.name})
            )
        return sorted(result, key=lambda region: region["name"])

    @staticmethod
    def _get_categories(queryset: QuerySet[PCRProject]):
        category_labels = dict(Project.Category.choices)
        values = (
            queryset.exclude(project__category__isnull=True)
            .exclude(project__category="")
            .order_by("project__category")
            .values_list("project__category", flat=True)
            .distinct()
        )
        return [
            {"id": category, "name": category_labels.get(category, category)}
            for category in values
        ]

    @staticmethod
    def _get_related_values(queryset: QuerySet[PCRProject], field_name: str):
        values = (
            queryset.order_by(f"{field_name}__name")
            .values_list(f"{field_name}__id", f"{field_name}__name")
            .distinct()
        )
        return [{"id": pk, "name": name} for pk, name in values if pk is not None]

    @staticmethod
    def _get_pcr_due_values(queryset: QuerySet[PCRProject]):
        values = set(queryset.values_list("pcr_due_value", flat=True).distinct())
        options = []
        if True in values:
            options.append({"id": "true", "name": "Yes"})
        if False in values:
            options.append({"id": "false", "name": "No"})
        return options

    @staticmethod
    def _get_cooperating_agencies(queryset: QuerySet[PCRProject]):
        values = (
            queryset.filter(project_has_cooperating_agency_q(prefix="project"))
            .order_by("project__agency__name")
            .values_list("project__agency_id", "project__agency__name")
            .distinct()
        )
        return [{"id": pk, "name": name} for pk, name in values if pk is not None]

    @action(methods=["GET"], detail=False)
    def list_filters(self, request, *args, **kwargs):
        queryset: QuerySet[PCRProject] = self.filter_queryset(self.get_queryset())
        result = {
            "region": self._get_regions(queryset),
            "country": self._get_related_values(queryset, "project__country"),
            "lead_agency": self._get_related_values(queryset, "project__lead_agency"),
            "cooperating_agency": self._get_cooperating_agencies(queryset),
            "cluster": self._get_related_values(queryset, "project__cluster"),
            "project_type": self._get_related_values(queryset, "project__project_type"),
            "sector": self._get_related_values(queryset, "project__sector"),
            "subsector": self._get_related_values(queryset, "project__subsectors"),
            "category": self._get_categories(queryset),
            "pcr_due": self._get_pcr_due_values(queryset),
        }
        return Response(result)
