import factory.fuzzy
from django.contrib.auth import get_user_model

from core.models import (
    Replenishment,
    Contribution,
    ContributionStatus,
    DisputedContribution,
    FermGainLoss,
)
from core.models.business_plan import (
    BusinessPlan,
    BPRecord,
    BPRecordValue,
    BPChemicalType,
)
from core.models.adm import AdmChoice, AdmColumn, AdmRecord, AdmRow
from core.models.agency import Agency
from core.models.country import Country
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPReportFormatColumn,
    CPReportFormatRow,
    CPUsage,
)

from core.models.group import Group
from core.models.meeting import Meeting
from core.models.project import (
    MetaProject,
    Project,
    ProjectCluster,
    ProjectOdsOdp,
    ProjectRBMMeasure,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
    SubmissionAmount,
)
from core.models.rbm_measures import RBMMeasure
from core.models.substance import Substance, SubstanceAltName
from core.models.time_frame import TimeFrame
from core.models.usage import ExcludedUsage, Usage
from core.models.blend import Blend, BlendAltName

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Faker("email")
    email = factory.Faker("email")
    password = factory.Faker(
        "password",
        length=10,
        special_chars=True,
        digits=True,
        upper_case=True,
        lower_case=True,
    )
    user_type = User.UserType.SECRETARIAT


class UsageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Usage

    name = factory.Faker("pystr", max_chars=100)
    full_name = factory.Faker("pystr", max_chars=248)
    description = factory.Faker("pystr", max_chars=248)
    sort_order = factory.Faker("random_int", min=1, max=100)


class GroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Group

    name = factory.Faker("pystr", max_chars=100)
    name_alt = factory.Faker("pystr", max_chars=100)
    annex = factory.Faker("pystr", max_chars=50)
    description = factory.Faker("pystr", max_chars=100)


class SubstanceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Substance

    name = factory.Faker("pystr", max_chars=100)
    formula = factory.Faker("pystr", max_chars=100)
    odp = factory.Faker("random_int", min=1, max=100)
    min_odp = factory.Faker("random_int", min=1, max=100)
    max_odp = factory.Faker("random_int", min=1, max=100)
    is_contained_in_polyols = factory.Faker("pybool")
    is_captured = factory.Faker("pybool")
    sort_order = factory.Faker("random_int", min=1, max=100)


class SubstanceAltNameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SubstanceAltName

    name = factory.Faker("pystr", max_chars=100)
    substance = factory.SubFactory(SubstanceFactory)


class BlendFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Blend

    name = factory.Faker("pystr", max_chars=64)
    other_names = factory.Faker("pystr", max_chars=100)
    odp = factory.Faker("random_int", min=1, max=100)
    gwp = factory.Faker("random_int", min=1, max=100)
    sort_order = factory.Faker("random_int", min=1, max=100)


class BlendAltNameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BlendAltName

    name = factory.Faker("pystr", max_chars=100)
    blend = factory.SubFactory(BlendFactory)


class TimeFrameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TimeFrame

    min_year = factory.Faker("random_int", min=1990, max=2000)
    max_year = factory.Faker("random_int", min=2001, max=2010)


class ExcludedUsageSubstFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExcludedUsage

    usage = factory.SubFactory(UsageFactory)
    substance = factory.SubFactory(SubstanceFactory)


class ExcludedUsageBlendFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExcludedUsage

    usage = factory.SubFactory(UsageFactory)
    blend = factory.SubFactory(BlendFactory)


class CountryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Country
        django_get_or_create = ("name",)

    name = factory.Faker("pystr", max_chars=50)
    abbr = factory.Faker("pystr", max_chars=5)


class CPReportFormatColumnFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPReportFormatColumn

    usage = factory.SubFactory(UsageFactory)
    time_frame = factory.SubFactory(TimeFrameFactory)
    section = factory.fuzzy.FuzzyChoice(["A", "B"])


class CPReportFormatRowFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPReportFormatRow

    substance = factory.SubFactory(SubstanceFactory)
    blend = factory.SubFactory(BlendFactory)
    time_frame = factory.SubFactory(TimeFrameFactory)
    section = factory.fuzzy.FuzzyChoice(["A", "B", "C"])
    sort_order = factory.Faker("random_int", min=1, max=100)


# country_programme_report factory
class CPReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPReport

    country = factory.SubFactory(CountryFactory)
    name = factory.Faker("pystr", max_chars=100)
    year = factory.Faker("random_int", min=1995, max=2030)
    created_by = factory.SubFactory(UserFactory)


class CPRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPRecord

    country_programme_report = factory.SubFactory(CPReportFactory)
    display_name = factory.Faker("pystr", max_chars=100)
    section = factory.Faker("pystr", max_chars=2)
    imports = factory.Faker("random_int", min=1, max=100)
    import_quotas = factory.Faker("random_int", min=1, max=100)
    exports = factory.Faker("random_int", min=1, max=100)
    production = factory.Faker("random_int", min=1, max=100)
    manufacturing_blends = factory.Faker("random_int", min=1, max=100)
    remarks = factory.Faker("pystr", max_chars=100)


class CPUsageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPUsage

    country_programme_record = factory.SubFactory(CPRecordFactory)
    usage = factory.SubFactory(UsageFactory)
    quantity = factory.Faker("random_int", min=1, max=100)


class CPPricesFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPPrices

    country_programme_report = factory.SubFactory(CPReportFactory)
    display_name = factory.Faker("pystr", max_chars=100)
    previous_year_price = factory.Faker("random_int", min=1, max=100)
    current_year_price = factory.Faker("random_int", min=1, max=100)


class CPGenerationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPGeneration

    country_programme_report = factory.SubFactory(CPReportFactory)
    all_uses = factory.Faker("random_int", min=1, max=100)
    feedstock = factory.Faker("random_int", min=1, max=100)
    destruction = factory.Faker("random_int", min=1, max=100)


class CPEmissionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPEmission

    country_programme_report = factory.SubFactory(CPReportFactory)
    facility = factory.Faker("rpyst", max_chars=100)
    total = factory.Faker("random_int", min=1, max=100)
    all_uses = factory.Faker("random_int", min=1, max=100)
    feedstock_gc = factory.Faker("random_int", min=1, max=100)
    destruction = factory.Faker("random_int", min=1, max=100)
    feedstock_wpc = factory.Faker("random_int", min=1, max=100)
    destruction_wpc = factory.Faker("random_int", min=1, max=100)
    generated_emissions = factory.Faker("random_int", min=1, max=100)
    remarks = factory.Faker("pystr", max_chars=100)


class AdmColumnFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AdmColumn

    name = factory.Faker("pystr", max_chars=248)
    display_name = factory.Faker("pystr", max_chars=248)
    type = factory.fuzzy.FuzzyChoice(AdmColumn.AdmColumnType.choices)
    section = factory.fuzzy.FuzzyChoice(AdmColumn.AdmColumnSection.choices)
    time_frame = factory.SubFactory(TimeFrameFactory)
    sort_order = factory.Faker("random_int", min=1, max=100)


class AdmRowFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AdmRow

    text = factory.Faker("pystr", max_chars=100)
    type = factory.fuzzy.FuzzyChoice(AdmRow.AdmRowType.choices)
    section = factory.fuzzy.FuzzyChoice(AdmRow.AdmRowSection.choices)
    time_frame = factory.SubFactory(TimeFrameFactory)
    index = factory.Faker("pystr", max_chars=10)
    sort_order = factory.Faker("random_int", min=1, max=100)


class AdmChoiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AdmChoice

    adm_row = factory.SubFactory(AdmRowFactory)
    value = factory.Faker("pystr", max_chars=100)
    sort_order = factory.Faker("random_int", min=1, max=100)


class AdmRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AdmRecord

    country_programme_report = factory.SubFactory(CPReportFactory)
    column = factory.SubFactory(AdmColumnFactory)
    row = factory.SubFactory(AdmRowFactory)
    value_text = factory.Faker("pystr", max_chars=100)


class AgencyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Agency

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)
    agency_type = Agency.AgencyType.AGENCY


class ProjectTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectType

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)
    sort_order = factory.Faker("random_int", min=1, max=100)


class ProjectStatusFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectStatus

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)


class ProjectSectorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectSector

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)
    sort_order = factory.Faker("random_int", min=1, max=100)


class ProjectSubSectorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectSubSector

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)
    sort_order = factory.Faker("random_int", min=1, max=100)
    sector = factory.SubFactory(ProjectSectorFactory)


class MeetingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Meeting

    number = factory.Faker("random_int", min=1, max=100)
    date = factory.Faker("date")
    status = Meeting.MeetingStatus.COMPLETED


class ProjectClusterFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectCluster

    name = factory.Faker("pystr", max_chars=100)
    code = factory.Faker("pystr", max_chars=10)
    category = ProjectCluster.ProjectClusterCategory.BOTH
    sort_order = factory.Faker("random_int", min=1, max=100)


class MetaProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MetaProject

    code = factory.Faker("pystr", max_chars=10)
    type = "Individual investment"


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    title = factory.Faker("pystr", max_chars=100)
    description = factory.Faker("pystr", max_chars=200)
    project_type = factory.SubFactory(ProjectTypeFactory)
    status = factory.SubFactory(ProjectStatusFactory)
    sector = factory.SubFactory(ProjectSectorFactory)
    subsector = factory.SubFactory(ProjectSubSectorFactory)
    agency = factory.SubFactory(AgencyFactory)
    country = factory.SubFactory(CountryFactory)
    approval_meeting = factory.SubFactory(MeetingFactory)
    submission_category = "bilateral cooperation"
    submission_number = factory.Faker("random_int", min=1, max=100)


class ProjectOdsOdpFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectOdsOdp

    project = factory.SubFactory(ProjectFactory)
    odp = factory.Faker("random_int", min=1, max=100)
    ods_replacement = factory.Faker("pystr", max_chars=100)
    co2_mt = factory.Faker("random_int", min=1, max=100)
    sort_order = factory.Faker("random_int", min=1, max=100)


class RbmMeasureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RBMMeasure

    name = factory.Faker("pystr", max_chars=100)
    description = factory.Faker("pystr", max_chars=10)
    sort_order = factory.Faker("random_int", min=1, max=100)


class ProjectRBMMeasureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectRBMMeasure

    project = factory.SubFactory(ProjectFactory)
    measure = factory.SubFactory(RbmMeasureFactory)
    value = factory.Faker("random_int", min=1, max=100)


class SubmissionAmountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SubmissionAmount

    project = factory.SubFactory(ProjectFactory)
    status = SubmissionAmount.SubmissionStatus.REQUESTED
    amount = factory.Faker("random_int", min=1, max=100)
    amount_psc = factory.Faker("random_int", min=1, max=100)
    impact = factory.Faker("random_int", min=1, max=100)
    cost_effectiveness = factory.Faker("random_int", min=1, max=100)


class BusinessPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BusinessPlan

    year_start = factory.Faker("random_int", min=2000, max=2009)
    year_end = factory.Faker("random_int", min=2010, max=2019)
    agency = factory.SubFactory(AgencyFactory)
    status = factory.fuzzy.FuzzyChoice(BusinessPlan.Status.choices)


class BPChemicalTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BPChemicalType

    name = factory.Faker("pystr", max_chars=200, prefix="bpchemicaltype-name")


class BPRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BPRecord

    business_plan = factory.SubFactory(BusinessPlanFactory)
    title = factory.Faker("pystr", max_chars=200, prefix="bprecord-title")
    required_by_model = factory.Faker(
        "pystr", max_chars=200, prefix="bprecord-required-by-model"
    )
    country = factory.SubFactory(CountryFactory)
    lvc_status = factory.fuzzy.FuzzyChoice(BPRecord.LVCStatus.choices)
    project_type = factory.SubFactory(ProjectTypeFactory)
    bp_chemical_type = factory.SubFactory(BPChemicalTypeFactory)
    amount_polyol = factory.Faker("random_int", min=1, max=1000)
    sector = factory.SubFactory(ProjectSectorFactory)
    subsector = factory.SubFactory(ProjectSubSectorFactory)
    bp_type = factory.fuzzy.FuzzyChoice(BPRecord.BPType.choices)
    reason_for_exceeding = factory.Faker(
        "pystr", max_chars=200, prefix="bprecord-reason-for-exceeding"
    )
    remarks = factory.Faker("pystr", max_chars=200, prefix="bprecord-remarks")
    remarks_additional = factory.Faker(
        "pystr", max_chars=200, prefix="bprecord-remarks-additional"
    )


class BPRecordValueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BPRecordValue

    bp_record = factory.SubFactory(BPRecordFactory)
    year = factory.Faker("random_int", min=2000, max=2024)
    value_usd = factory.Faker("random_int", min=1, max=10000)
    value_odp = factory.Faker("random_int", min=1, max=10000)
    value_mt = factory.Faker("random_int", min=1, max=10000)


class ReplenishmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Replenishment

    start_year = factory.Faker("random_int", min=2000, max=2024)
    end_year = factory.Faker("random_int", min=2000, max=2024)
    amount = factory.Faker("pydecimal", left_digits=10, right_digits=2)


class ContributionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Contribution

    country = factory.SubFactory(CountryFactory)
    replenishment = factory.SubFactory(ReplenishmentFactory)
    currency = factory.Faker("pystr", max_chars=3)
    exchange_rate = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    bilateral_assistance_amount = factory.Faker(
        "pydecimal", left_digits=10, right_digits=2
    )
    un_scale_of_assessment = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    override_adjusted_scale_of_assessment = factory.Faker(
        "pydecimal", left_digits=10, right_digits=2
    )
    average_inflation_rate = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    override_qualifies_for_fixed_rate_mechanism = factory.Faker("pybool")


class ContributionStatusFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ContributionStatus

    country = factory.SubFactory(CountryFactory)
    year = factory.Faker("random_int", min=2000, max=2024)
    agreed_contributions = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    cash_payments = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    bilateral_assistance = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    promissory_notes = factory.Faker("pydecimal", left_digits=10, right_digits=2)
    outstanding_contributions = factory.Faker(
        "pydecimal", left_digits=10, right_digits=2
    )


class DisputedContributionsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DisputedContribution

    year = factory.Faker("random_int", min=2000, max=2024)
    amount = factory.Faker("pydecimal", left_digits=10, right_digits=2)


class FermGainLossFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FermGainLoss

    country = factory.SubFactory(CountryFactory)
    amount = factory.Faker("pydecimal", left_digits=10, right_digits=2)
