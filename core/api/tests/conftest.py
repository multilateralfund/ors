# pylint: disable=W0621
import pytest
import unicodedata

from pdfminer.high_level import extract_text

from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRowFactory,
    AgencyFactory,
    BlendFactory,
    CPRaportFormatFactory,
    CPReportFactory,
    CountryFactory,
    ExcludedUsageBlendFactory,
    ExcludedUsageSubstFactory,
    GroupFactory,
    MeetingFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectOdsOdpFactory,
    ProjectRBMMeasureFactory,
    ProjectSectorFactory,
    ProjectStatusFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    RbmMeasureFactory,
    SubstanceFactory,
    TimeFrameFactory,
    UsageFactory,
    UserFactory,
)
from core.models import CPReport


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def country_ro():
    return CountryFactory.create(name="Romania")


@pytest.fixture
def cp_report_2005(country_ro):
    return CPReportFactory.create(
        country=country_ro,
        year=2005,
        comment="Si daca e rau, tot e bine",
        status=CPReport.CPReportStatus.FINAL,
    )


@pytest.fixture
def cp_report_2019(country_ro):
    return CPReportFactory.create(
        country=country_ro, year=2019, comment="Daca ploua nu ma ploua"
    )


@pytest.fixture
def time_frames():
    frame = [(2000, 2011), (2012, 2018), (2019, None), (2000, None)]
    time_frames = {}
    for min_year, max_year in frame:
        time_frames[(min_year, max_year)] = TimeFrameFactory.create(
            min_year=min_year,
            max_year=max_year,
        )

    return time_frames


@pytest.fixture(name="_cp_report_format")
def cp_report_format(time_frames):
    usageA = UsageFactory.create(name="usage A", sort_order=1)
    usageB = UsageFactory.create(name="usage B", sort_order=2)
    usageAa = UsageFactory.create(name="usage Aa", sort_order=11, parent=usageA)
    usageAb = UsageFactory.create(name="usage Ab", sort_order=12, parent=usageA)
    usageAaa = UsageFactory.create(name="usage Aaa", sort_order=111, parent=usageAa)

    create_data = []
    for usage in [usageA, usageAa, usageAaa]:
        create_data.append(
            {
                "usage": usage,
                "time_frame": time_frames[(2000, 2011)],
                "section": "A",
            }
        )

    for usage in [usageA, usageAa, usageAb, usageAaa]:
        create_data.append(
            {
                "usage": usage,
                "time_frame": time_frames[(2012, 2018)],
                "section": "B",
            }
        )

    create_data.extend(
        [
            {
                "usage": usageB,
                "time_frame": time_frames[(2000, None)],
                "section": "A",
            },
            {
                "usage": usageB,
                "time_frame": time_frames[(2019, None)],
                "section": "B",
            },
        ]
    )
    cp_report_formats = []
    for data in create_data:
        cp_report_formats.append(CPRaportFormatFactory.create(**data))

    return cp_report_formats


@pytest.fixture
def adm_rows(time_frames):
    row_data = {
        "type": "question",
        "parent": None,
        "time_frame": time_frames[(2000, 2011)],
    }
    b_row = AdmRowFactory.create(
        text="adm_row_b",
        section="B",
        **row_data,
    )
    c_row = AdmRowFactory.create(
        text="adm_row_c",
        section="C",
        **row_data,
    )
    d_row = AdmRowFactory.create(
        text="adm_row_d",
        section="D",
        **row_data,
    )

    for i in range(3):
        AdmChoiceFactory.create(
            adm_row=d_row,
            value=f"d_row_choice_{i}",
            sort_order=i,
        )

    return b_row, c_row, d_row


@pytest.fixture
def adm_columns(time_frames):
    column_data = {"time_frame": time_frames[(2000, 2011)]}
    b_column = AdmColumnFactory.create(
        display_name="adm_column_b",
        section="B",
        **column_data,
    )
    c_column = AdmColumnFactory.create(
        display_name="adm_column_c",
        section="C",
        **column_data,
    )

    return b_column, c_column


@pytest.fixture
def usage():
    return UsageFactory.create(name="usage")


@pytest.fixture
def excluded_usage():
    return UsageFactory.create(name="excluded_usage")


@pytest.fixture
def groupA():
    return GroupFactory.create(name="group A", annex="A")


@pytest.fixture
def substance(excluded_usage, groupA, time_frames):
    substance = SubstanceFactory.create(
        name="substance",
        group=groupA,
        odp=0.02,
        gwp=0.05,
    )
    ExcludedUsageSubstFactory.create(
        substance=substance,
        usage=excluded_usage,
        time_frame=time_frames[(2000, None)],
    )
    return substance


@pytest.fixture
def blend(excluded_usage, time_frames):
    blend = BlendFactory.create(name="blend")
    ExcludedUsageBlendFactory.create(
        blend=blend,
        usage=excluded_usage,
        time_frame=time_frames[(2000, None)],
    )
    return blend


@pytest.fixture
def agency():
    return AgencyFactory.create(name="Agency")


@pytest.fixture
def project_type():
    return ProjectTypeFactory.create(name="Project Type", code="PT", sort_order=1)


@pytest.fixture
def project_status():
    return ProjectStatusFactory.create(name="Project Status", code="PS")


@pytest.fixture
def sector():
    return ProjectSectorFactory.create(name="Sector", code="SEC", sort_order=1)


@pytest.fixture
def subsector(sector):
    return ProjectSubSectorFactory.create(
        name="Subsector", code="SUB", sector=sector, sort_order=1
    )


@pytest.fixture
def rbm_measure():
    return RbmMeasureFactory.create(name="RBM Measure", sort_order=1)


@pytest.fixture
def meeting():
    return MeetingFactory.create(number=1, date="2019-03-14")


@pytest.fixture
def project_cluster_kpp():
    return ProjectClusterFactory.create(name="KPP1", code="KPP1", sort_order=1)


@pytest.fixture
def project_cluster_kip():
    return ProjectClusterFactory.create(name="KIP1", code="KIP1", sort_order=2)


@pytest.fixture
def project(
    country_ro,
    agency,
    project_type,
    project_status,
    subsector,
    meeting,
    project_cluster_kpp,
):
    project = ProjectFactory.create(
        title="Karma to Burn",
        country=country_ro,
        agency=agency,
        project_type=project_type,
        status=project_status,
        subsector=subsector,
        approval_meeting=meeting,
        substance_type="HCFC",
        cluster=project_cluster_kpp,
        fund_disbursed=123.1,
        total_fund_transferred=123.1,
        date_approved="2019-03-14",
    )

    return project


@pytest.fixture
def project_rbm_measure(project, rbm_measure):
    return ProjectRBMMeasureFactory(project=project, measure=rbm_measure, value=10)


@pytest.fixture
def project_ods_odp_subst(project, substance):
    return ProjectOdsOdpFactory(
        project=project,
        ods_substance=substance,
        odp=0.02,
        co2_mt=0.05,
        sort_order=1,
    )


@pytest.fixture
def project_ods_odp_blend(project, blend):
    return ProjectOdsOdpFactory(
        project=project,
        ods_blend=blend,
        odp=0.02,
        co2_mt=0.05,
        sort_order=1,
    )


def pdf_text(pdf_file):
    text = extract_text(pdf_file)
    # Normalize to avoid weird comparisons like 'ﬃ' != 'ffi'
    return unicodedata.normalize("NFKD", text)
