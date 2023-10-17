import factory.fuzzy
from core.models.adm import AdmChoice, AdmColumn, AdmRecord, AdmRow
from core.models.agency import Agency
from core.models.country import Country
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPReportFormat,
    CPUsage,
)

from core.models.group import Group
from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.project_submission import ProjectSubmission
from core.models.substance import Substance
from core.models.time_frame import TimeFrame
from core.models.usage import ExcludedUsage, Usage
from core.models.blend import Blend
from core.models.user import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Faker("last_name")
    email = factory.Faker("email")
    password = factory.Faker(
        "password",
        length=10,
        special_chars=True,
        digits=True,
        upper_case=True,
        lower_case=True,
    )


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


class BlendFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Blend

    name = factory.Faker("pystr", max_chars=64)
    other_names = factory.Faker("pystr", max_chars=100)
    odp = factory.Faker("random_int", min=1, max=100)
    gwp = factory.Faker("random_int", min=1, max=100)
    sort_order = factory.Faker("random_int", min=1, max=100)


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

    name = factory.Faker("pystr", max_chars=50)
    abbr = factory.Faker("pystr", max_chars=5)


class CPRaportFormatFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPReportFormat

    usage = factory.SubFactory(UsageFactory)
    time_frame = factory.SubFactory(TimeFrameFactory)
    section = factory.fuzzy.FuzzyChoice(["A", "B"])


# country_programme_report factory
class CPReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CPReport

    country = factory.SubFactory(CountryFactory)
    name = factory.Faker("pystr", max_chars=100)
    year = factory.Faker("random_int", min=1995, max=2030)


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
    description = factory.Faker("pystr", max_chars=200)


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


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    title = factory.Faker("pystr", max_chars=100)
    description = factory.Faker("pystr", max_chars=200)
    project_type = factory.SubFactory(ProjectTypeFactory)
    status = factory.SubFactory(ProjectStatusFactory)
    subsector = factory.SubFactory(ProjectSubSectorFactory)
    agency = factory.SubFactory(AgencyFactory)
    country = factory.SubFactory(CountryFactory)
    approval_meeting_no = factory.Faker("random_int", min=1, max=100)


class ProjectSubmissionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectSubmission

    project = factory.SubFactory(ProjectFactory)
    category = "bilateral cooperation"
    submission_number = factory.Faker("random_int", min=1, max=100)


class ProjectOdsOdpFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectOdsOdp

    project = factory.SubFactory(ProjectFactory)
    odp = factory.Faker("random_int", min=1, max=100)
    ods_replacement = factory.Faker("pystr", max_chars=100)
    co2_mt = factory.Faker("random_int", min=1, max=100)
    sort_order = factory.Faker("random_int", min=1, max=100)
