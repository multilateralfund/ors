from django.urls import path, re_path
from rest_framework import permissions
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views import ProjectFundViewSet
from core.api.views import ProjectCommentViewSet
from core.api.views import ProjectFileView
from core.api.views.agency import AgencyListView
from core.api.views.chemicals import (
    BlendCreateView,
    BlendsListView,
    SubstancesListView,
)
from core.api.views.country_programme import (
    CPRecordListView,
    CPReportView,
    CPReportGroupByYearView,
    CPReportGroupByCountryView,
    EmptyFormView,
)
from core.api.views.projects import (
    ProjectOdsOdpViewSet,
    ProjectViewSet,
    ProjectMeetingListView,
    ProjectSectorListView,
    ProjectStatusListView,
    ProjectSubSectorListView,
    ProjectTypeListView,
)
from core.api.views.settings import SettingsView
from core.api.views.usages import UsageListView
from core.api.views.countries import CountryListView

router = routers.SimpleRouter()
router.register("projects", ProjectViewSet)
router.register("project-fund", ProjectFundViewSet)
router.register("project-ods-odp", ProjectOdsOdpViewSet)
router.register("project-comment", ProjectCommentViewSet)


schema_view = get_schema_view(
    openapi.Info(
        title="Multilateral Fund API",
        default_version="v1",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    re_path(
        r"^docs(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^docs/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    *router.urls,
    path(
        "settings/",
        SettingsView.as_view(),
        name="settings",
    ),
    path(
        "agencies/",
        AgencyListView.as_view(),
        name="agency-list",
    ),
    path(
        "usages/",
        UsageListView.as_view(),
        name="usages-list",
    ),
    path(
        "substances/",
        SubstancesListView.as_view(),
        name="substances-list",
    ),
    path("blends/", BlendsListView.as_view(), name="blends-list"),
    path("blends/create/", BlendCreateView.as_view(), name="blends-create"),
    path(
        "country-programme/reports/",
        CPReportView.as_view(),
        name="country-programme-reports",
    ),
    path(
        "country-programme/reports-by-year/",
        CPReportGroupByYearView.as_view(),
        name="country-programme-reports-by-year",
    ),
    path(
        "country-programme/reports-by-country/",
        CPReportGroupByCountryView.as_view(),
        name="country-programme-reports-by-country",
    ),
    path(
        "country-programme/records/",
        CPRecordListView.as_view(),
        name="country-programme-record-list",
    ),
    path(
        "country-programme/empty-form/",
        EmptyFormView.as_view(),
        name="empty-form",
    ),
    path(
        "countries/",
        CountryListView.as_view(),
        name="countries-list",
    ),
    path(
        "project-statuses/",
        ProjectStatusListView.as_view(),
        name="project-status-list",
    ),
    path(
        "project-sectors/",
        ProjectSectorListView.as_view(),
        name="project-sector-list",
    ),
    path(
        "project-subsectors/",
        ProjectSubSectorListView.as_view(),
        name="project-subsector-list",
    ),
    path(
        "project-types/",
        ProjectTypeListView.as_view(),
        name="project-type-list",
    ),
    path(
        "project-meetings/",
        ProjectMeetingListView.as_view(),
        name="project-meeting-list",
    ),
    re_path(
        "^project-files/(?P<pk>[^/]+)/$",
        ProjectFileView.as_view(),
        name="project-files",
    ),
]
