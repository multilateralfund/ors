from django.urls import path

from core.api.views.chemicals import GroupSubstancesListAPIView, BlendsListAPIView
from core.api.views.country_programme import (
    CountryProgrammeRecordListAPIView,
    CountryProgrammeReportListAPIView,
)
from core.api.views.usages import UsageListAPIView
from core.api.views.countries import CountryListAPIView

urlpatterns = [
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
        "countries",
        CountryListAPIView.as_view(),
        name="countries-list",
    ),
]
