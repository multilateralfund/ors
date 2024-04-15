from django.urls import path, re_path
from rest_framework import permissions
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views import ProjectFundViewSet
from core.api.views import ProjectCommentViewSet
from core.api.views import ProjectFileView
from core.api.views.agency import AgencyListView
from core.api.views.business_plan import BPRecordViewSet
from core.api.views.business_plan import BusinessPlanViewSet
from core.api.views.chemicals import (
    BlendCreateView,
    BlendsListView,
    SimilarBlendsListView,
    SubstancesListView,
)
from core.api.views.cp_archive import (
    CPFilesArchiveView,
    CPRecordArchiveExportView,
    CPRecordArchivePrintView,
    CPRecordsArchiveListView,
    CPReportVersionsListView,
)
from core.api.views.cp_files import CPFilesView
from core.api.views.cp_prices import CPPricesView
from core.api.views.cp_records_export import CPEmptyExportView
from core.api.views.cp_reports import (
    CPReportStatusUpdateView,
    CPReportView,
    CPReportGroupByYearView,
    CPReportGroupByCountryView,
    CPReportCommentsView,
)
from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_records_export import CPRecordPrintView
from core.api.views.cp_records_export import CPRecordExportView
from core.api.views.cp_report_empty_form import EmptyFormView
from core.api.views.meetings import MeetingListView
from core.api.views.projects import (
    ProjectClusterListView,
    ProjectOdsOdpViewSet,
    ProjectRbmMeasureViewSet,
    ProjectStatisticsView,
    ProjectSubmissionAmountViewSet,
    ProjectViewSet,
    ProjectSectorListView,
    ProjectStatusListView,
    ProjectSubSectorListView,
    ProjectTypeListView,
)
from core.api.views.rbm_measures import RBMMeasureListView
from core.api.views.settings import SettingsView
from core.api.views.usages import UsageListView
from core.api.views.countries import CountryListView

router = routers.SimpleRouter()
router.register("projects", ProjectViewSet)
router.register("project-fund", ProjectFundViewSet)
router.register("project-ods-odp", ProjectOdsOdpViewSet)
router.register("project-comment", ProjectCommentViewSet)
router.register("project-rbm-measure", ProjectRbmMeasureViewSet)
router.register("submission-amount", ProjectSubmissionAmountViewSet)
router.register("business-plan", BusinessPlanViewSet)
router.register("business-plan-record", BPRecordViewSet)


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
    path("blends/similar/", SimilarBlendsListView.as_view(), name="blends-similar"),
    path("blends/create/", BlendCreateView.as_view(), name="blends-create"),
    path(
        "country-programme/reports/",
        CPReportView.as_view(),
        name="country-programme-reports",
    ),
    path(
        "country-programme/reports/<int:id>/",
        CPReportView.as_view(),
        name="country-programme-reports-update",
    ),
    path(
        "country-programme/report/<int:id>/status-update/",
        CPReportStatusUpdateView.as_view(),
        name="country-programme-report-status",
    ),
    path(
        "country-programme/report/<int:id>/comments/",
        CPReportCommentsView.as_view(),
        name="country-programme-report-comments",
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
        "country-programme/prices/",
        CPPricesView.as_view(),
        name="country-programme-price-list",
    ),
    path(
        "country-programme/export/",
        CPRecordExportView.as_view(),
        name="country-programme-export",
    ),
    path(
        "country-programme/export-empty/",
        CPEmptyExportView.as_view(),
        name="country-programme-export-empty",
    ),
    path(
        "country-programme/print/",
        CPRecordPrintView.as_view(),
        name="country-programme-print",
    ),
    path(
        "country-programme/empty-form/",
        EmptyFormView.as_view(),
        name="empty-form",
    ),
    path(
        "country-programme/versions/",
        CPReportVersionsListView.as_view(),
        name="country-programme-versions",
    ),
    path(
        "country-programme/files/",
        CPFilesView.as_view(),
        name="country-programme-files",
    ),
    path(
        "country-programme-archive/files/",
        CPFilesArchiveView.as_view(),
        name="country-programme-archive-files",
    ),
    path(
        "country-programme-archive/records/",
        CPRecordsArchiveListView.as_view(),
        name="country-programme-archive-record-list",
    ),
    path(
        "country-programme-archive/export/",
        CPRecordArchiveExportView.as_view(),
        name="country-programme-archive-export",
    ),
    path(
        "country-programme-archive/print/",
        CPRecordArchivePrintView.as_view(),
        name="country-programme-archive-print",
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
        "projects-statistics/",
        ProjectStatisticsView.as_view(),
        name="project-statistics",
    ),
    path(
        "meetings/",
        MeetingListView.as_view(),
        name="meeting-list",
    ),
    path(
        "project-clusters/",
        ProjectClusterListView.as_view(),
        name="project-cluster-list",
    ),
    path(
        "rbm-measures/",
        RBMMeasureListView.as_view(),
        name="rbm-measure-list",
    ),
    re_path(
        "^project-files/(?P<pk>[^/]+)/$",
        ProjectFileView.as_view(),
        name="project-files",
    ),
]
