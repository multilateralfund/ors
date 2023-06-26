from django.urls import path, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views.chemicals import (
    GroupSubstancesListAPIView,
    BlendsListAPIView,
)
from core.api.views.country_programme import (
    CountryProgrammeRecordListAPIView,
    CountryProgrammeReportListAPIView,
)
from core.api.views.usages import UsageListAPIView
from core.api.views.countries import CountryListAPIView


schema_view = get_schema_view(
    openapi.Info(
        title="Multilateral Fund API",
        default_version="v1",
        description="API docs for mlf",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
    path("usages/", UsageListAPIView.as_view(), name="usages-list"),
    path(
        "group-substances/",
        GroupSubstancesListAPIView.as_view(),
        name="group-substances-list",
    ),
    path("blends/", BlendsListAPIView.as_view(), name="blends-list"),
    path(
        "country-programme/reports/",
        CountryProgrammeReportListAPIView.as_view(),
        name="country-programme-report-list",
    ),
    path(
        "country-programme/records/",
        CountryProgrammeRecordListAPIView.as_view(),
        name="country-programme-record-list",
    ),
    path(
        "countries/",
        CountryListAPIView.as_view(),
        name="countries-list",
    ),
]
