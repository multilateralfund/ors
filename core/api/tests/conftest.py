# pylint: disable=W0621,R0913, R0914
import pytest
import unicodedata

from django.contrib.auth.models import Group
from django.core.management import call_command

from pdfminer.high_level import extract_text

from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRowFactory,
    AgencyFactory,
    BPChemicalTypeFactory,
    BlendFactory,
    CPReportFormatColumnFactory,
    CPReportFormatRowFactory,
    CPReportFactory,
    CountryFactory,
    DecisionFactory,
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
    ProjectSpecificFieldsFactory,
    ProjectStatusFactory,
    ProjectSubmissionStatusFactory,
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
from core.models.business_plan import BusinessPlan
from core.models.country_programme_archive import CPReportArchive
from core.utils import get_meta_project_code, get_project_sub_code

# pylint: disable=C0302,W0613


@pytest.fixture
def user():
    return UserFactory(username="FlorinSalam", email="salam@reggaeton.ta")


@pytest.fixture
def secretariat_user():
    secretariat_group = Group.objects.get(name="CP - Secretariat")
    business_plan_editor_group = Group.objects.get(name="BP - Editor")
    user = UserFactory(username="SecretariatUser", email="secretariat_user@mail.com")
    user.groups.add(secretariat_group)
    user.groups.add(business_plan_editor_group)
    return user


@pytest.fixture
def second_user():
    secretariat_group = Group.objects.get(name="CP - Secretariat")
    user = UserFactory(username="Plebeii", email="restul@cantaretilor.ro")
    user.groups.add(secretariat_group)
    return user


@pytest.fixture
def viewer_user():
    group = Group.objects.get(name="Projects - Agency viewer")
    user = UserFactory(username="GuraCasca", email="doarmauit@numersi.ro")
    user.groups.add(group)
    return user


@pytest.fixture
def admin_user():
    return UserFactory(
        username="Admin",
        email="admin@test.com",
        is_superuser=True,
    )


@pytest.fixture
def secretariat_viewer_user():
    group = Group.objects.get(name="Projects - MLFS Viewer")
    user = UserFactory(username="secretariat_viewer", email="testuser@test.com")
    user.groups.add(group)
    return user


@pytest.fixture
def secretariat_v1_v2_edit_access_user():
    group = Group.objects.get(name="Projects - MLFS Submission V1/V2")
    user = UserFactory(
        username="secretariat_v1_v2_edit_access",
        email="secretariat_v1_v2_edit_access@mail.com",
    )
    user.groups.add(group)
    return user


@pytest.fixture
def secretariat_v3_edit_access_user():
    group = Group.objects.get(name="Projects - MLFS Submission V3")
    user = UserFactory(
        username="secretariat_v3_edit_access",
        email="secretariat_v3_edit_access@mail.com",
    )
    user.groups.add(group)
    return user


@pytest.fixture
def secretariat_production_v1_v2_edit_access_user():
    group = Group.objects.get(name="Projects - MLFS Submission V1/V2 Production")
    user = UserFactory(
        username="secretariat_production_v1_v2_edit_access",
        email="secretariat_production_v1_v2_edit_access@mail.com",
    )
    user.groups.add(group)
    return user


@pytest.fixture
def secretariat_production_v3_edit_access_user():
    group = Group.objects.get(name="Projects - MLFS Submission V3 Production")
    user = UserFactory(
        username="secretariat_production_v3_edit_access",
        email="secretariat_production_v3_edit_access@mail.com",
    )
    user.groups.add(group)
    return user


@pytest.fixture(scope="session", autouse=True)
def load_groups_and_permissions(django_db_setup, django_db_blocker):
    """
    Loads Groups and Permissions from a file once per test session.
    """
    with django_db_blocker.unblock():
        call_command("import_user_permissions", "all")


@pytest.fixture
def bp_viewer_user():
    group = Group.objects.get(name="BP - Viewer")
    user = UserFactory(username="bp_viewer", email="bp_viewer@mail.com")
    user.groups.add(group)
    return user


@pytest.fixture
def bp_editor_user():
    group = Group.objects.get(name="BP - Editor")
    user = UserFactory(username="bp_editor", email="bp_editor@mail.com")
    user.groups.add(group)
    return user


@pytest.fixture
def stakeholder_user():
    group = Group.objects.get(name="Replenishment - Viewer")
    user = UserFactory()
    user.groups.add(group)
    return user


@pytest.fixture
def agency():
    return AgencyFactory.create(name="Agency", code="AG")


@pytest.fixture(name="new_agency")
def _new_agency():
    return AgencyFactory.create(name="Agency2", code="AG2")


@pytest.fixture
def agency_user(agency):
    group = Group.objects.get(name="Projects - Agency submitter")
    business_plan_viewer_group = Group.objects.get(name="BP - Viewer")
    user = UserFactory(username="AgencyUser", agency=agency)
    user.groups.add(group)
    user.groups.add(business_plan_viewer_group)
    return user


@pytest.fixture
def agency_inputter_user(agency):
    group = Group.objects.get(name="Projects - Agency inputter")
    business_plan_viewer_group = Group.objects.get(name="BP - Viewer")

    user = UserFactory(username="AgencyInputterUser", agency=agency)
    user.groups.add(group)
    user.groups.add(business_plan_viewer_group)
    return user


@pytest.fixture
def country_ro():
    return CountryFactory.create(name="Romania", iso3="ROM")


@pytest.fixture
def country_viewer_user(country_ro):
    group = Group.objects.get(name="CP - Viewer")
    user = UserFactory(username="CountryViewer", country=country_ro)
    user.groups.add(group)
    return user


@pytest.fixture
def country_user(country_ro):
    group = Group.objects.get(name="CP - Country user")
    user = UserFactory(username="CountryUser", country=country_ro)
    user.groups.add(group)
    return user


@pytest.fixture
def country_submitter(country_ro):
    group = Group.objects.get(name="CP - Country submitter")
    user = UserFactory(country=country_ro)
    user.groups.add(group)
    return user


@pytest.fixture
def treasurer_user():
    treasurer_group = Group.objects.get(name="Replenishment - Treasurer")
    user = UserFactory(username="FaraNumar")
    user.groups.add(treasurer_group)
    return user


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
def cp_report_2019(country_ro, secretariat_user):
    return CPReportFactory.create(
        country=country_ro,
        year=2019,
        comment="Valoare eu la toti va dau",
        created_by=secretariat_user,
        version_created_by=secretariat_user,
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
def project_draft_status():
    return ProjectSubmissionStatusFactory.create(
        name="Draft", code="draft", color="#FF0000"
    )


@pytest.fixture
def project_submitted_status():
    return ProjectSubmissionStatusFactory.create(
        name="Submitted", code="submitted", color="#00FF00"
    )


@pytest.fixture
def project_approved_status():
    return ProjectSubmissionStatusFactory.create(name="Approved", code="approved")


@pytest.fixture
def sector():
    return ProjectSectorFactory.create(name="Sector", code="SEC", sort_order=1)


@pytest.fixture
def subsector(sector):
    return ProjectSubSectorFactory.create(
        name="Subsector", code="SUB", sector=sector, sort_order=1
    )


@pytest.fixture
def sector_other():
    return ProjectSectorFactory.create(name="Other", code="OTH", sort_order=2)


@pytest.fixture
def subsector_other_sector_other(sector_other):
    return ProjectSubSectorFactory.create(name="Other", code="OTH", sector=sector_other)


@pytest.fixture
def subsector_other(sector):
    return ProjectSubSectorFactory.create(
        name=f"Other {sector.name}", code=f"OTH{sector.code}", sector=sector
    )


@pytest.fixture
def rbm_measure():
    return RbmMeasureFactory.create(name="RBM Measure", sort_order=1)


@pytest.fixture
def meeting():
    return MeetingFactory.create(number=1, date="2019-03-14")


@pytest.fixture
def decision(meeting):
    return DecisionFactory.create(number=1, meeting=meeting)


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
    project_draft_status,
    sector,
    subsector,
    meeting,
    project_cluster_kpp,
    meta_project,
):
    code = get_project_sub_code(
        country_ro, project_cluster_kpp, agency, project_type, sector, meeting, None
    )
    project = ProjectFactory.create(
        meta_project=meta_project,
        title="Karma to Burn",
        country=country_ro,
        agency=agency,
        project_type=project_type,
        status=project_status,
        submission_status=project_draft_status,
        sector=sector,
        subsectors=[subsector],
        meeting=meeting,
        substance_type="HCFC",
        cluster=project_cluster_kpp,
        fund_disbursed=123.1,
        total_fund_transferred=123.1,
        date_approved="2019-03-14",
        serial_number=1,
        code=code,
    )

    return project


@pytest.fixture
def project2(
    country_ro,
    agency,
    project_type,
    project_status,
    project_draft_status,
    sector,
    subsector,
    meeting,
    project_cluster_kpp,
    meta_project_mya,
):
    code = get_project_sub_code(
        country_ro, project_cluster_kpp, agency, project_type, sector, meeting, None
    )
    project = ProjectFactory.create(
        meta_project=meta_project_mya,
        title="Karma to Burn",
        country=country_ro,
        agency=agency,
        project_type=project_type,
        status=project_status,
        submission_status=project_draft_status,
        sector=sector,
        subsectors=[subsector],
        meeting=meeting,
        substance_type="HCFC",
        cluster=project_cluster_kpp,
        fund_disbursed=123.1,
        total_fund_transferred=123.1,
        date_approved="2019-03-14",
        serial_number=1,
        code=code,
    )

    return project


@pytest.fixture
def project3(
    country_ro,
    agency,
    project_type,
    project_status,
    project_draft_status,
    sector,
    subsector,
    meeting,
    project_cluster_kpp,
    meta_project_mya,
):
    code = get_project_sub_code(
        country_ro, project_cluster_kpp, agency, project_type, sector, meeting, None
    )
    project = ProjectFactory.create(
        meta_project=meta_project_mya,
        title="Karma to Burn",
        country=country_ro,
        agency=agency,
        project_type=project_type,
        status=project_status,
        submission_status=project_draft_status,
        sector=sector,
        subsectors=[subsector],
        meeting=meeting,
        substance_type="HCFC",
        cluster=project_cluster_kpp,
        fund_disbursed=123.1,
        total_fund_transferred=123.1,
        date_approved="2019-03-14",
        serial_number=1,
        code=code,
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
def business_plan():
    return BusinessPlanFactory(
        year_start=2020,
        year_end=2022,
        status=BusinessPlan.Status.endorsed,
    )


@pytest.fixture
def bp_chemical_type():
    return BPChemicalTypeFactory(name="BPChemicalType")


@pytest.fixture
def bp_activity(business_plan, country_ro, agency):
    return BPActivityFactory(
        business_plan=business_plan,
        agency=agency,
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
def setup_new_cp_report(cp_report_2019, blend, substance, time_frames, groupA, user):
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
    blend4noform = BlendFactory.create(
        name="AddedByUser", sort_order=None, created_by=user
    )  # inf, inf

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


@pytest.fixture(name="_setup_bp_activity_create")
def setup_bp_activity_create(
    agency,
    country_ro,
    sector,
    subsector,
    project_type,
    bp_chemical_type,
    project_cluster_kpp,
    substance,
):
    ProjectSpecificFieldsFactory.create(
        cluster=project_cluster_kpp,
        type=project_type,
        sector=sector,
    )
    return {
        "initial_id": 1,
        "title": "Planu",
        "agency_id": agency.id,
        "country_id": country_ro.id,
        "lvc_status": "LVC",
        "project_type_id": project_type.id,
        "project_type_code": project_type.code,
        "bp_chemical_type_id": bp_chemical_type.id,
        "project_cluster_id": project_cluster_kpp.id,
        "substances": [substance.id],
        "sector_id": sector.id,
        "sector_code": sector.code,
        "subsector_id": subsector.id,
        "status": "A",
        "is_multi_year": False,
        "reason_for_exceeding": "Planu, planu, planu, planu, planu",
        "remarks": "Merge bine, bine, bine ca aeroplanu",
        "values": [
            {
                "year": 2025,
                "is_after": False,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
                "value_co2": 100,
            },
            {
                "year": 2026,
                "is_after": False,
                "value_usd": 200,
                "value_odp": 200,
                "value_mt": 200,
                "value_co2": 200,
            },
            {
                "year": 2027,
                "is_after": False,
                "value_usd": 300,
                "value_odp": 300,
                "value_mt": 300,
                "value_co2": 300,
            },
            {
                "year": 2027,
                "is_after": True,
                "value_usd": 400,
                "value_odp": 400,
                "value_mt": 400,
                "value_co2": 400,
            },
        ],
    }
