from django.urls import path, re_path
from rest_framework import permissions
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views import (
    ProjectFundViewSet,
    ReplenishmentCountriesViewSet,
    ReplenishmentViewSet,
    AnnualStatusOfContributionsView,
    ScaleOfAssessmentViewSet,
    TriennialStatusOfContributionsView,
    SummaryStatusOfContributionsView,
    ReplenishmentDashboardView,
    ReplenishmentInvoiceViewSet,
    ReplenishmentInvoiceFileDownloadView,
    ReplenishmentPaymentViewSet,
    ReplenishmentPaymentFileDownloadView,
    DisputedContributionViewSet,
    ReplenishmentDashboardExportView,
    SummaryStatusOfContributionsExportView,
    TriennialStatusOfContributionsExportView,
)
from core.api.views import ProjectCommentViewSet
from core.api.views import ProjectFileView
from core.api.views.agency import AgencyListView
from core.api.views.business_plan import (
    BPFileDownloadView,
    BPFileView,
    BPActivityViewSet,
)
from core.api.views.business_plan import BPStatusUpdateView, BusinessPlanViewSet
from core.api.views.chemicals import (
    BlendCreateView,
    BlendNextCustNameView,
    BlendsListView,
    SimilarBlendsListView,
    SubstancesListView,
)
from core.api.views.cp_archive import (
    CPRecordArchiveExportView,
    CPRecordArchivePrintView,
    CPRecordsArchiveListView,
    CPReportVersionsListView,
)
from core.api.views.cp_files import CPFilesDownloadView, CPFilesView
from core.api.views.cp_prices import CPPricesView
from core.api.views.cp_records_export import (
    CPCalculatedAmountExportView,
    CPDataExtractionAllExport,
    CPEmptyExportView,
    CPHCFCExportView,
    CPHFCExportView,
    CPReportListExportView,
)
from core.api.views.cp_reports import (
    CPReportStatusUpdateView,
    CPReportView,
    CPReportGroupByYearView,
    CPReportGroupByCountryView,
    CPReportCommentsView,
)
from core.api.views.cp_records import CPRecordListView, CPRecordListDiffView
from core.api.views.cp_records_export import (
    CPCalculatedAmountPrintView,
    CPRecordPrintView,
)
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
    ProjectStatusListView,
    ProjectTypeListView,
)
from core.api.views.rbm_measures import RBMMeasureListView
from core.api.views.sector_subsector import ProjectSectorView, ProjectSubSectorView
from core.api.views.settings import SettingsView
from core.api.views.usages import UsageListView
from core.api.views.countries import CountryListView
from core.api.views.comment_types import CommentTypeListView

router = routers.SimpleRouter()
router.register("projects", ProjectViewSet)
router.register("project-fund", ProjectFundViewSet)
router.register("project-ods-odp", ProjectOdsOdpViewSet)
router.register("project-comment", ProjectCommentViewSet)
router.register("project-rbm-measure", ProjectRbmMeasureViewSet)
router.register("project-sector", ProjectSectorView)
router.register("project-subsector", ProjectSubSectorView)
router.register("submission-amount", ProjectSubmissionAmountViewSet)
router.register("business-plan", BusinessPlanViewSet, basename="businessplan")
router.register("business-plan-activity", BPActivityViewSet, basename="bpactivity")
router.register(
    "replenishment/countries",
    ReplenishmentCountriesViewSet,
    basename="replenishment-countries",
)
router.register(
    "replenishment/replenishments",
    ReplenishmentViewSet,
    basename="replenishment-replenishments",
)
router.register(
    "replenishment/disputed-contributions",
    DisputedContributionViewSet,
    basename="replenishment-disputed-contributions",
)
router.register(
    "replenishment/scales-of-assessment",
    ScaleOfAssessmentViewSet,
    basename="replenishment-scales-of-assessment",
)
router.register(
    "replenishment/invoices",
    ReplenishmentInvoiceViewSet,
    basename="replenishment-invoices",
)
router.register(
    "replenishment/payments",
    ReplenishmentPaymentViewSet,
    basename="replenishment-payments",
)


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
        "blends/next-cust-mix-name/",
        BlendNextCustNameView.as_view(),
        name="blends-next-cust-mix-name",
    ),
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
        "country-programme/records/diff/",
        CPRecordListDiffView.as_view(),
        name="country-programme-record-diff",
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
        "country-programme/reports/export/",
        CPReportListExportView.as_view(),
        name="country-programme-reports-export",
    ),
    path(
        "country-programme/hfc/export/",
        CPHFCExportView.as_view(),
        name="country-programme-hfc-export",
    ),
    path(
        "country-programme/hcfc/export/",
        CPHCFCExportView.as_view(),
        name="country-programme-hcfc-export",
    ),
    path(
        "country-programme/data-extraction-all/export/",
        CPDataExtractionAllExport.as_view(),
        name="country-programme-extraction-all-export",
    ),
    path(
        "country-programme/calculated-amount/export/",
        CPCalculatedAmountExportView.as_view(),
        name="country-programme-calculated-amount-export",
    ),
    path(
        "country-programme/calculated-amount/print/",
        CPCalculatedAmountPrintView.as_view(),
        name="country-programme-calculated-amount-print",
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
        "country-programme/files/<int:id>/download/",
        CPFilesDownloadView.as_view(),
        name="country-programme-files-download",
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
    path(
        "business-plan/<int:id>/file/",
        BPFileView.as_view(),
        name="business-plan-file",
    ),
    path(
        "business-plan/<int:id>/file/download/",
        BPFileDownloadView.as_view(),
        name="business-plan-file-download",
    ),
    path(
        "business-plan/<int:id>/status-update/",
        BPStatusUpdateView.as_view(),
        name="business-plan-status",
    ),
    path(
        "replenishment/dashboard/",
        ReplenishmentDashboardView.as_view(),
        name="replenishment-dashboard",
    ),
    path(
        "replenishment/dashboard/export/",
        ReplenishmentDashboardExportView.as_view(),
        name="replenishment-dashboard-export",
    ),
    path(
        "replenishment/status-of-contributions/summary/export/",
        SummaryStatusOfContributionsExportView.as_view(),
        name="replenishment-status-of-contributions-summary-export",
    ),
    path(
        "replenishment/status-of-contributions/summary/",
        SummaryStatusOfContributionsView.as_view(),
        name="replenishment-status-of-contributions-summary",
    ),
    path(
        "replenishment/status-of-contributions/<int:start_year>/<int:end_year>/export/",
        TriennialStatusOfContributionsExportView.as_view(),
        name="replenishment-status-of-contributions-triennial-export",
    ),
    path(
        "replenishment/status-of-contributions/<int:start_year>/<int:end_year>/",
        TriennialStatusOfContributionsView.as_view(),
        name="replenishment-status-of-contributions-triennial",
    ),
    path(
        "replenishment/status-of-contributions/<int:year>/",
        AnnualStatusOfContributionsView.as_view(),
        name="replenishment-status-of-contributions-annual",
    ),
    path(
        "replenishment/invoice-file/<int:id>/download/",
        ReplenishmentInvoiceFileDownloadView.as_view(),
        name="replenishment-invoice-file-download",
    ),
    path(
        "replenishment/payment-file/<int:id>/download/",
        ReplenishmentPaymentFileDownloadView.as_view(),
        name="replenishment-payment-file-download",
    ),
    path(
        "comment-types/",
        CommentTypeListView.as_view(),
        name="comment-type-list",
    ),
    *router.urls,
]
