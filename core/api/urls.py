from django.urls import path, re_path
from rest_framework import routers, permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from core.api.views import (
    ProjectFundViewSet,
    ReplenishmentCountriesViewSet,
    ReplenishmentCountriesSOAViewSet,
    ReplenishmentAsOfDateViewSet,
    ReplenishmentBudgetYearsViewSet,
    ReplenishmentViewSet,
    AnnualStatusOfContributionsView,
    ScaleOfAssessmentViewSet,
    ReplenishmentScaleOfAssessmentVersionFileDownloadView,
    TriennialStatusOfContributionsView,
    SummaryStatusOfContributionsView,
    ReplenishmentDashboardView,
    ReplenishmentExternalAllocationViewSet,
    ReplenishmentExternalIncomeAnnualViewSet,
    ReplenishmentInvoiceViewSet,
    ReplenishmentInvoiceFileDownloadView,
    ReplenishmentPaymentViewSet,
    ReplenishmentPaymentFileDownloadView,
    DisputedContributionViewSet,
    BilateralAssistanceViewSet,
    ReplenishmentDashboardExportView,
    SummaryStatusOfContributionsExportView,
    TriennialStatusOfContributionsExportView,
    StatisticsStatusOfContributionsExportView,
    AnnualStatusOfContributionsExportView,
    StatusOfContributionsExportView,
    StatisticsExportView,
    StatisticsStatusOfContributionsView,
    StatusOfTheFundFileViewSet,
    ConsolidatedInputDataExportView,
    UserPermissionsView,
)
from core.api.views.agency import AgencyListView, BusinessPlanAgencyListView
from core.api.views.bp_export import BPActivityExportView
from core.api.views.business_plan import (
    BPChemicalTypeListView,
    BPFileDownloadView,
    BPFileView,
    BPActivityViewSet,
    BPImportValidateView,
    BPImportView,
    BusinessPlanViewSet,
)
from core.api.views.chemicals import (
    BlendCreateView,
    BlendNextCustNameView,
    BlendsListView,
    GroupListView,
    SimilarBlendsListView,
    SubstancesListView,
)
from core.api.views.cp_archive import (
    CPRecordArchiveExportView,
    CPRecordArchivePrintView,
    CPRecordsArchiveListView,
    CPReportVersionsListView,
)
from core.api.views.projects_metadata import (
    ProjectClusterTypeSectorAssociationView,
    ProjectFieldView,
)
from core.api.views.cp_emissions_generations import DashboardsCPEmissionsView
from core.api.views.cp_files import CPFilesDownloadView, CPFilesView
from core.api.views.cp_prices import DashboardsCPPricesView, CPPricesView
from core.api.views.cp_records_export import (
    CPCalculatedAmountExportView,
    CPDataExtractionAllExport,
    CPEmptyExportView,
    CPHCFCExportView,
    CPHFCExportView,
    CPReportListExportView,
    CPCalculatedAmountPrintView,
    CPRecordPrintView,
    CPRecordExportView,
)
from core.api.views.cp_reports import (
    CPReportStatusUpdateView,
    CPReportView,
    CPReportGroupByYearView,
    CPReportGroupByCountryView,
    CPReportCommentsView,
)
from core.api.views.cp_records import (
    DashboardsCPRecordView,
    CPRecordListByReportView,
    CPRecordListDiffView,
)
from core.api.views.cp_report_empty_form import EmptyFormView
from core.api.views.cp_resources import CPResourcesView
from core.api.views.meetings import DecisionListView, MeetingListView
from core.api.views.projects import (
    MetaProjectListView,
    ProjectClusterListView,
    ProjectSpecificFieldsListView,
    ProjectOdsOdpViewSet,
    ProjectRbmMeasureViewSet,
    ProjectStatisticsView,
    ProjectSubmissionAmountViewSet,
    ProjectViewSet,
    ProjectStatusListView,
    ProjectSubmissionStatusListView,
    ProjectTypeListView,
    ProjectCommentViewSet,
    ProjectFileView,
)
from core.api.views.projects_v2 import (
    ProjectDestructionTechnologyView,
    ProjectProductionControlTypeView,
    ProjectOdsOdpTypeView,
    ProjectV2ViewSet,
    ProjectV2FileView,
    ProjectV2FileIncludePreviousVersionsView,
    ProjectFilesDownloadView,
    ProjectFilesValidationView,
)
from core.api.views.project_associations import ProjectAssociationViewSet
from core.api.views.rbm_measures import RBMMeasureListView
from core.api.views.sector_subsector import ProjectSectorView, ProjectSubSectorView
from core.api.views.settings import SettingsView
from core.api.views.usages import UsageListView
from core.api.views.countries import CountryListView, BusinessPlanCountryListView

router = routers.SimpleRouter()
router.register("projects/v2", ProjectV2ViewSet, basename="project-v2")
router.register("projects", ProjectViewSet, basename="project")
router.register(
    "project-association", ProjectAssociationViewSet, basename="project-association"
)
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
    "replenishment/countries-soa",
    ReplenishmentCountriesSOAViewSet,
    basename="replenishment-countries-soa",
)
router.register(
    "replenishment/as-of-date",
    ReplenishmentAsOfDateViewSet,
    basename="replenishment-as-of-date",
)
router.register(
    "replenishment/budget-years",
    ReplenishmentBudgetYearsViewSet,
    basename="replenishment-budget-years",
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
    "replenishment/bilateral-assistance",
    BilateralAssistanceViewSet,
    basename="replenishment-bilateral-assistance",
)
router.register(
    "replenishment/scales-of-assessment",
    ScaleOfAssessmentViewSet,
    basename="replenishment-scales-of-assessment",
)
router.register(
    "replenishment/external-allocations",
    ReplenishmentExternalAllocationViewSet,
    basename="replenishment-external-allocations",
)
router.register(
    "replenishment/external-income",
    ReplenishmentExternalIncomeAnnualViewSet,
    basename="replenishment-external-income",
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
router.register(
    "replenishment/status-files",
    StatusOfTheFundFileViewSet,
    basename="replenishment-status-files",
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
        "groups/",
        GroupListView.as_view(),
        name="group-list",
    ),
    path(
        "substances/",
        SubstancesListView.as_view(),
        name="substances-list",
    ),
    path(
        "project-fields/",
        ProjectFieldView.as_view(),
        name="project-fields",
    ),
    path(
        "project-cluster-types-sectors/",
        ProjectClusterTypeSectorAssociationView.as_view(),
        name="project-cluster-type-sector-association",
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
        CPRecordListByReportView.as_view(),
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
        "country-programme/dashboards/records/",
        DashboardsCPRecordView.as_view(),
        name="country-programme-dashboards-record",
    ),
    path(
        "country-programme/dashboards/prices/",
        DashboardsCPPricesView.as_view(),
        name="country-programme-dashboards-price-list",
    ),
    path(
        "country-programme/dashboards/emissions/",
        DashboardsCPEmissionsView.as_view(),
        name="country-programme-dashboards-emissions-list",
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
        "country-programme/resources/",
        CPResourcesView.as_view(),
        name="country-programme-resources",
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
        "meta-projects/",
        MetaProjectListView.as_view(),
        name="meta-project-list",
    ),
    path(
        "project-statuses/",
        ProjectStatusListView.as_view(),
        name="project-status-list",
    ),
    path(
        "project-submission-statuses/",
        ProjectSubmissionStatusListView.as_view(),
        name="project-submission-status-list",
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
        "decisions/",
        DecisionListView.as_view(),
        name="decision-list",
    ),
    path(
        "project-destruction-technology/",
        ProjectDestructionTechnologyView.as_view(),
        name="project-destruction-technology",
    ),
    path(
        "project-production-control-type/",
        ProjectProductionControlTypeView.as_view(),
        name="project-production-control-type",
    ),
    path(
        "project-ods-odp-type/",
        ProjectOdsOdpTypeView.as_view(),
        name="project-ods-odp-type",
    ),
    path(
        "project-clusters/",
        ProjectClusterListView.as_view(),
        name="project-cluster-list",
    ),
    path(
        "project-cluster/<int:cluster_id>/type/<int:type_id>/sector/<int:sector_id>/fields/",
        ProjectSpecificFieldsListView.as_view(),
        name="project-specific-fields",
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
        "project/<int:project_id>/files/v2/",
        ProjectV2FileView.as_view(),
        name="project-files-v2",
    ),
    path(
        "project/<int:project_id>/files/include_previous_versions/v2/",
        ProjectV2FileIncludePreviousVersionsView.as_view(),
        name="project-v2-file-include-previous-versions",
    ),
    path(
        "project/<int:project_id>/files/<int:id>/download/v2/",
        ProjectFilesDownloadView.as_view(),
        name="project-files-v2-download",
    ),
    path(
        "project/files/validate/",
        ProjectFilesValidationView.as_view(),
        name="project-files-validation",
    ),
    path(
        "business-plan/upload/validate/",
        BPImportValidateView.as_view(),
        name="bp-upload-validate",
    ),
    path(
        "business-plan/upload/",
        BPImportView.as_view(),
        name="bp-upload",
    ),
    path(
        "business-plan/agencies/",
        BusinessPlanAgencyListView.as_view(),
        name="bp-agencies-list",
    ),
    path(
        "business-plan/countries/",
        BusinessPlanCountryListView.as_view(),
        name="business-plan-countries-list",
    ),
    path(
        "business-plan/bp-chemical-types/",
        BPChemicalTypeListView.as_view(),
        name="bp-chemical-type-list",
    ),
    path(
        "business-plan-activity/export/",
        BPActivityExportView.as_view(),
        name="bpactivity-export",
    ),
    path(
        "business-plan/files/",
        BPFileView.as_view(),
        name="business-plan-files",
    ),
    path(
        "business-plan/files/<int:id>/download/",
        BPFileDownloadView.as_view(),
        name="business-plan-file-download",
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
        "replenishment/status-of-contributions/statistics/",
        StatisticsStatusOfContributionsView.as_view(),
        name="replenishment-status-of-contributions-statistics",
    ),
    path(
        "replenishment/status-of-contributions/statistics-export/",
        StatisticsStatusOfContributionsExportView.as_view(),
        name="replenishment-status-of-contributions-statistics-export",
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
        "replenishment/status-of-contributions/export/",
        StatusOfContributionsExportView.as_view(),
        name="replenishment-status-of-contributions-export",
    ),
    path(
        "replenishment/status-of-contributions/<int:start_year>/<int:end_year>/",
        TriennialStatusOfContributionsView.as_view(),
        name="replenishment-status-of-contributions-triennial",
    ),
    path(
        "replenishment/status-of-contributions/<int:year>/export/",
        AnnualStatusOfContributionsExportView.as_view(),
        name="replenishment-status-of-contributions-annual-export",
    ),
    path(
        "replenishment/statistics/export/",
        StatisticsExportView.as_view(),
        name="replenishment-statistics-export",
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
        "replenishment/scale-of-assessment-version/<int:id>/file/download/",
        ReplenishmentScaleOfAssessmentVersionFileDownloadView.as_view(),
        name="scale-of-assessment-version-file-download",
    ),
    path(
        "replenishment/input-data/export/",
        ConsolidatedInputDataExportView.as_view(),
        name="replenishment-input-data-export",
    ),
    path(
        "user/permissions/",
        UserPermissionsView.as_view(),
        name="user-permissions",
    ),
    *router.urls,
]
