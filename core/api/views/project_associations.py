from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets, filters

from core.api.permissions import HasProjectV2ViewAccess
from core.api.serializers.project_association import MetaProjectSerializer
from core.models.project import MetaProject

# pylint: disable=R1710


class ProjectAssociationViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for listing project associations with meta projects.
    This viewset allows users to retrieve a list of meta projects and their associated projects.
    """

    permission_classes = [HasProjectV2ViewAccess]
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "lead_agency__name",
        "type",
        "projects__title",
        "projects__country__name",
        "projects__agency__name",
        "projects__sector__name",
        "projects__project_type__name",
        "projects__substance_type",
        "projects__submission_status__name",
        "projects__status__name",
        "projects__meta_project__code",
        "projects__code",
        "projects__cluster__code",
        "projects__tranche",
        "projects__total_fund",
    ]
    serializer_class = MetaProjectSerializer
    search_fields = ["projects__title"]

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(projects__agency=user.agency) | Q(lead_agency=user.agency)
            ).distinct()
        return queryset.none()

    def get_queryset(self):
        queryset = MetaProject.objects.all()
        queryset = self.filter_permissions_queryset(queryset)
        queryset = queryset.select_related(
            "lead_agency",
        ).prefetch_related(
            "projects__agency",
            "projects__coop_agencies",
            "projects__cluster",
            "projects__country",
            "projects__rbm_measures__measure",
            "projects__project_type",
            "projects__sector",
            "projects__meeting",
            "projects__subsectors__sector",
            "projects__subsectors",
            "projects__status",
            "projects__submission_amounts",
            "projects__submission_status",
            "projects__ods_odp",
            "projects__funds",
            "projects__comments",
            "projects__files",
        )
        return queryset
