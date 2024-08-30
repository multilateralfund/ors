# pylint: disable=W0621,R0913, R0914
import pytest
import unicodedata

from pdfminer.high_level import extract_text

from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRowFactory,
    AgencyFactory,
    BPChemicalTypeFactory,
    BlendFactory,
    CommentTypeFactory,
    CPReportFormatColumnFactory,
    CPReportFormatRowFactory,
    CPReportFactory,
    CountryFactory,
    ExcludedUsageBlendFactory,
    ExcludedUsageSubstFactory,
    GroupFactory,
    MeetingFactory,
    MetaProjectFactory,
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
    BusinessPlanFactory,
    BPActivityFactory,
    BPActivityValueFactory,
    AdmRecordFactory,
    CPGenerationFactory,
    CPPricesFactory,
    CPRecordFactory,
    CPUsageFactory,
)
from core.models import BPActivity
from core.models import CPEmission
from core.models import CPReport
from core.models.adm import AdmRecordArchive
from core.models.country_programme_archive import CPReportArchive
from core.utils import get_meta_project_code, get_project_sub_code


@pytest.fixture
def user():
    return UserFactory(username="FlorinSalam", email="salam@reggaeton.ta")


@pytest.fixture
def second_user():
    return UserFactory(username="Plebeii", email="restul@cantaretilor.ro")


@pytest.fixture
def stakeholder_user():
    return UserFactory(user_type="stakeholder")


@pytest.fixture
def agency():
    return AgencyFactory.create(name="Agency", code="AG")


@pytest.fixture
def agency_user(agency):
    return UserFactory(user_type="agency_submitter", agency=agency)


@pytest.fixture
def agency_inputter_user(agency):
    return UserFactory(user_type="agency_inputter", agency=agency)


@pytest.fixture
def country_ro():
    return CountryFactory.create(name="Romania", iso3="ROM")


@pytest.fixture
def country_user(country_ro):
    return UserFactory(user_type="country_user", country=country_ro)


@pytest.fixture
def country_submitter(country_ro):
    return UserFactory(user_type="country_submitter", country=country_ro)


@pytest.fixture
def treasurer_user():
    return UserFactory(username="FaraNumar", user_type="treasurer")


@pytest.fixture
def cp_report_1996(country_ro, user):
    return CPReportFactory.create(
        country=country_ro,
        year=1996,
        comment="Am viatza de Barosan chiar daca sunt un pushtan",
        status=CPReport.CPReportStatus.FINAL,
        created_by=user,
    )


@pytest.fixture
def cp_report_2005(country_ro, user):
    return CPReportFactory.create(
        country=country_ro,
        year=2005,
        comment="Am fost si vom fi o legenda vie",
        status=CPReport.CPReportStatus.FINAL,
        created_by=user,
    )


@pytest.fixture
def cp_report_2019(country_ro, user):
    return CPReportFactory.create(
        country=country_ro,
        year=2019,
        comment="Valoare eu la toti va dau",
        created_by=user,
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
        cp_report_formats.append(CPReportFormatColumnFactory.create(**data))

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
    return GroupFactory.create(
        name="group A", annex="A", name_alt="group A A", group_id="AI"
    )


@pytest.fixture
def substance(excluded_usage, groupA, time_frames):
    substance = SubstanceFactory.create(
        name="HCFC-substance",
        sort_order=1,
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
    blend = BlendFactory.create(
        name="blend",
        sort_order=1,
        odp=0.02,
        gwp=0.05,
    )
    ExcludedUsageBlendFactory.create(
        blend=blend,
        usage=excluded_usage,
        time_frame=time_frames[(2000, None)],
    )
    return blend


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
def meta_project(country_ro, project_cluster_kpp):
    code = get_meta_project_code(country_ro, project_cluster_kpp)

    return MetaProjectFactory.create(code=code)


@pytest.fixture
def meta_project_mya(country_ro, project_cluster_kip):
    code = get_meta_project_code(country_ro, project_cluster_kip)

    return MetaProjectFactory.create(code=code, type="Multi-year agreement")


@pytest.fixture
def project(
    country_ro,
    agency,
    project_type,
    project_status,
    sector,
    subsector,
    meeting,
    project_cluster_kpp,
    meta_project,
):
    generated_code = get_project_sub_code(
        country_ro, project_cluster_kpp, agency, project_type, sector, meeting, None
    )
    project = ProjectFactory.create(
        meta_project=meta_project,
        title="Karma to Burn",
        country=country_ro,
        agency=agency,
        project_type=project_type,
        status=project_status,
        sector=sector,
        subsector=subsector,
        approval_meeting=meeting,
        substance_type="HCFC",
        cluster=project_cluster_kpp,
        fund_disbursed=123.1,
        total_fund_transferred=123.1,
        date_approved="2019-03-14",
        serial_number=1,
        generated_code=generated_code,
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


@pytest.fixture
def business_plan(agency):
    return BusinessPlanFactory(
        year_start=2020,
        year_end=2022,
        agency=agency,
        version=2,
    )


@pytest.fixture()
def old_business_plan(agency):
    return BusinessPlanFactory(
        year_start=2020,
        year_end=2022,
        agency=agency,
        version=1,
        is_latest=False,
    )


@pytest.fixture
def bp_chemical_type():
    return BPChemicalTypeFactory(name="BPChemicalType")


@pytest.fixture
def bp_activity(business_plan, country_ro):
    return BPActivityFactory(
        business_plan=business_plan,
        country=country_ro,
        status=BPActivity.Status.approved,
    )


@pytest.fixture
def old_bp_activity(old_business_plan, country_ro):
    return BPActivityFactory(
        business_plan=old_business_plan,
        country=country_ro,
        status=BPActivity.Status.approved,
    )


@pytest.fixture
def bp_activity_values(bp_activity):
    return [
        BPActivityValueFactory(bp_activity=bp_activity, year=2020),
        BPActivityValueFactory(bp_activity=bp_activity, year=2021),
        BPActivityValueFactory(bp_activity=bp_activity, year=2022),
        BPActivityValueFactory(bp_activity=bp_activity, year=2022, is_after=True),
    ]


def pdf_text(pdf_file):
    text = extract_text(pdf_file)
    # Normalize to avoid weird comparisons like 'ﬃ' != 'ffi'
    return unicodedata.normalize("NFKD", text)


@pytest.fixture(name="_setup_new_cp_report")
def setup_new_cp_report(cp_report_2019, blend, substance, time_frames, groupA):
    # create prev year cp report
    prev_report = CPReportFactory.create(
        country=cp_report_2019.country,
        year=2018,
        comment="Alo baza baza",
        status=CPReport.CPReportStatus.FINAL,
    )
    # create cp format rows
    substAinform = SubstanceFactory.create(name="HCFC-substance2", group=groupA)  # 200
    substAnoform = SubstanceFactory.create(name="HCFC-substance3", group=groupA)  # inf
    current_group = GroupFactory.create(
        name="group B", annex="B", name_alt="group B B", group_id="BI"
    )
    substBinform = SubstanceFactory.create(
        name="HCFC-substance4", group=current_group
    )  # 300
    current_group = GroupFactory.create(
        name="group F", annex="F", name_alt="group F F", group_id="F"
    )
    substF1inform = SubstanceFactory.create(
        name="HFC-substance5", group=current_group
    )  # 100
    substF2inform = SubstanceFactory.create(
        name="HFC-substance6", group=current_group
    )  # 200
    current_group = GroupFactory.create(
        name="Other", annex="unknown", name_alt="group Other", group_id="uncontrolled"
    )
    substO1inform = SubstanceFactory.create(
        name="substance5", group=current_group
    )  # 300
    substOnoform = SubstanceFactory.create(
        name="substance6", group=current_group
    )  # inf

    blend2inform = BlendFactory.create(name="blend2inform")  # 211
    blend3noform = BlendFactory.create(name="blend2noform", sort_order=234)  # inf, 234
    blend4noform = BlendFactory.create(name="AddedByUser", sort_order=None)  # inf, inf

    for i, subst in enumerate([substance, substAinform, substBinform]):
        for sect in ["A", "C"]:
            CPReportFormatRowFactory.create(
                blend=None,
                substance=subst,
                section=sect,
                time_frame=time_frames[(2000, None)],
                sort_order=(i + 1) * 100,
            )
    for i, subst in enumerate([substF1inform, substF2inform, substO1inform]):
        for sect in ["B", "C"]:
            CPReportFormatRowFactory.create(
                blend=None,
                substance=subst,
                section=sect,
                time_frame=time_frames[(2000, None)],
                sort_order=(i + 1) * 100,
            )

    for i, ble in enumerate([blend, blend2inform]):
        for sect in ["B", "C"]:
            CPReportFormatRowFactory.create(
                blend=ble,
                substance=None,
                section=sect,
                time_frame=time_frames[(2000, None)],
                sort_order=i + 210,
            )

    # section A
    for subst in [substance, substAnoform]:
        CPRecordFactory.create(
            country_programme_report=cp_report_2019,
            section="A",
            substance=subst,
            imports=None,
        )

    # section B
    for subst in [substF2inform, substOnoform]:
        CPRecordFactory.create(
            country_programme_report=cp_report_2019, section="B", substance=subst
        )
    for ble in [blend3noform, blend4noform, blend]:
        cp_rec = CPRecordFactory.create(
            country_programme_report=cp_report_2019, section="B", blend=ble
        )

    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)

    # section C (prices)
    for cp_report in [cp_report_2019, prev_report]:
        for ble in [blend, blend3noform, blend4noform]:
            CPPricesFactory.create(
                country_programme_report=cp_report,
                blend=ble,
                previous_year_price=None,
                current_year_price=cp_report.year,
            )
    for subst in [substance, substAnoform, substF2inform, substOnoform]:
        CPPricesFactory.create(
            country_programme_report=cp_report_2019,
            substance=subst,
            current_year_price=cp_report_2019.year,
            previous_year_price=cp_report_2019.year - 1,
        )

    # section D (generation)
    CPGenerationFactory.create(country_programme_report=cp_report_2019)

    # section E (emissions)
    for _ in range(2):
        CPEmission.objects.create(country_programme_report=cp_report_2019)


@pytest.fixture(name="_setup_old_cp_report")
def setup_old_cp_report(cp_report_2005, substance, blend, groupA, time_frames):
    # section A
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2005,
        section="A",
        substance=substance,
        imports=None,
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)
    # substance
    new_subst = SubstanceFactory.create(name="substance2", group=groupA)

    CPReportFormatRowFactory.create(
        blend=None,
        substance=new_subst,
        section="A",
        time_frame=time_frames[(2000, 2011)],
        sort_order=5,
    )

    # section C (prices)
    CPPricesFactory.create(country_programme_report=cp_report_2005, blend=blend)
    CPPricesFactory.create(country_programme_report=cp_report_2005, substance=substance)

    # create rows and columns
    rows = {}
    columns = {}
    for section in ["B", "C", "D"]:
        data = {
            "section": section,
            "time_frame": time_frames[(2000, 2011)],
        }
        if section != "D":
            columns[section] = AdmColumnFactory.create(
                display_name=f"adm_column_{section}", sort_order=1, **data
            )

        rows[section] = AdmRowFactory.create(
            text=f"row{section}",
            index=None,
            type="question",
            parent=None,
            **data,
        )
        if section == "D":
            # creat choices
            for i in range(3):
                last_choice = AdmChoiceFactory.create(
                    adm_row=rows[section],
                    value="choice1",
                    sort_order=i,
                )

    # create records
    for section in ["B", "C", "D"]:
        record_data = {
            "country_programme_report": cp_report_2005,
            "row": rows[section],
            "column": columns.get(section, None),
            "value_text": f"record_{section}",
            "section": section,
        }
        if section == "D":
            record_data["value_choice"] = last_choice
        AdmRecordFactory.create(**record_data)

    return last_choice


@pytest.fixture(name="_setup_96_cp_report")
def setup_96_cp_report(cp_report_1996, substance):
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_1996, section="A", substance=substance
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)


@pytest.fixture(name="_setup_old_version_2019")
def setup_old_version_2019(cp_report_2019, substance, blend, time_frames, user):
    cp_report_2019.status = CPReport.CPReportStatus.FINAL
    cp_report_2019.version = 2
    cp_report_2019.save()

    CPReportFormatRowFactory.create(
        blend=blend,
        substance=None,
        section="B",
        time_frame=time_frames[(2000, None)],
        sort_order=2,
    )

    CPReportFormatRowFactory.create(
        blend=None,
        substance=substance,
        section="A",
        time_frame=time_frames[(2000, None)],
        sort_order=1,
    )

    cp_ar = CPReportArchive.objects.create(
        name=cp_report_2019.name,
        year=cp_report_2019.year,
        country=cp_report_2019.country,
        status=cp_report_2019.status,
        version=1,
        created_by=user,
    )

    return cp_ar


@pytest.fixture(name="_setup_old_version_2005")
def setup_old_version_2005(
    cp_report_2005, substance, blend, adm_rows, adm_columns, time_frames, user
):
    cp_report_2005.status = CPReport.CPReportStatus.FINAL
    cp_report_2005.version = 2
    cp_report_2005.save()

    CPReportFormatRowFactory.create(
        blend=blend,
        substance=None,
        section="B",
        time_frame=time_frames[(2000, None)],
        sort_order=2,
    )

    CPReportFormatRowFactory.create(
        blend=None,
        substance=substance,
        section="A",
        time_frame=time_frames[(2000, None)],
        sort_order=1,
    )

    cp_ar = CPReportArchive.objects.create(
        name=cp_report_2005.name,
        year=cp_report_2005.year,
        country=cp_report_2005.country,
        status=cp_report_2005.status,
        version=1,
        created_by=user,
    )

    adm_b_row = adm_rows[0]
    adm_b_col = adm_columns[0]

    AdmRecordArchive.objects.create(
        row=adm_b_row,
        column=adm_b_col,
        section="B",
        value_text="Treviso",
        country_programme_report=cp_ar,
    )

    return cp_ar


@pytest.fixture
def comment_type():
    return CommentTypeFactory(name="Sector & Subsector")
