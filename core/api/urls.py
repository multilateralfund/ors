from django.urls import path, re_path
from rest_framework import permissions
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views.adm import AdmEmptyFormView

from core.api.views.chemicals import (
    BlendCreateView,
    BlendsListView,
    SubstancesListView,
)
from core.api.views.country_programme import (
    CPRecordListView,
    CPReportListView,
    CPSettingsView,
)
from core.api.views.projects import (
    ProjectViewSet,
    ProjectStatusListView,
)
from core.api.views.usages import UsageListView
from core.api.views.countries import CountryListView

router = routers.SimpleRouter()
router.register('project', ProjectViewSet)


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
    path("usages/", UsageListView.as_view(), name="usages-list"),
    path(
        "substances/",
        SubstancesListView.as_view(),
        name="substances-list",
    ),
    path("blends/", BlendsListView.as_view(), name="blends-list"),
    path("blends/create/", BlendCreateView.as_view(), name="blends-create"),
    path(
        "country-programme/reports/",
        CPReportListView.as_view(),
        name="country-programme-report-list",
    ),
    path(
        "country-programme/records/",
        CPRecordListView.as_view(),
        name="country-programme-record-list",
    ),
    path(
        "country-programme/settings/",
        CPSettingsView.as_view(),
        name="country-programme-settings",
    ),
    path(
        "country-programme/adm/empty-form/",
        AdmEmptyFormView.as_view(),
        name="adm-empty-form",
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
]
