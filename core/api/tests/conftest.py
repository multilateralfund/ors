# pylint: disable=W0621,R0913, R0914
import pytest
import unicodedata
from datetime import date
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
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
    AnnualProgressReportFactory,
    AnnualAgencyProjectReportFactory,
    AnnualProjectReportFactory,
)
from core.models import Country
from core.models import BPActivity
from core.models import CPEmission
from core.models import CPReport
from core.models import ProjectFile, ProjectOdsOdp
from core.models.adm import AdmRecordArchive
from core.models.business_plan import BusinessPlan
from core.models.country_programme_archive import CPReportArchive
from core.utils import get_project_sub_code

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
def viewer_user(agency):
    group = Group.objects.get(name="Projects - Agency viewer")
    user = UserFactory(
        username="GuraCasca", email="doarmauit@numersi.ro", agency=agency
    )
    user.groups.add(group)
    return user


@pytest.fixture
def mlfs_admin_user():
    group = Group.objects.get(name="Projects - MLFS Admin")
    user = UserFactory(
        username="Projects - MLFS Admin",
        email="mlfs_admin@mail.com",
    )
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
def agency_viewer_user(agency):
    group = Group.objects.get(name="Projects - Agency viewer")
    user = UserFactory(username="AgencyViewerUser", agency=agency)
    user.groups.add(group)
    return user


@pytest.fixture
def apr_agency_viewer_user(agency):
    group = Group.objects.get(name="APR - Agency Viewer")
    user = UserFactory(username="APRAgencyViewer", agency=agency)
    user.groups.add(group)
    return user


@pytest.fixture
def apr_agency_inputter_user(agency):
    group = Group.objects.get(name="APR - Agency Inputter")
    user = UserFactory(username="APRAgencyInputter", agency=agency)
    user.groups.add(group)
    return user


@pytest.fixture
def apr_agency_submitter_user(agency):
    group = Group.objects.get(name="APR - Agency Submitter")
    user = UserFactory(
        username="APRAgencySubmitter",
        email="agency-submitter@agency.org",
        agency=agency,
    )
    user.groups.add(group)
    return user


@pytest.fixture
def apr_mlfs_full_access_user():
    group = Group.objects.get(name="APR - MLFS Full Access")
    user = UserFactory(username="APRMLFSFullAccess")
    user.groups.add(group)
    return user


@pytest.fixture
def new_country():
    return CountryFactory.create(iso3="NwC")


@pytest.fixture
def country_europe():
    return CountryFactory(name="Europe", location_type=Country.LocationType.REGION)


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
        id=7, name="group A", annex="A", name_alt="group A A", group_id="AI"
    )


@pytest.fixture
def groupHCFC():
    return GroupFactory.create(
        id=6, name="C/I", annex="C", name_alt="Annex C, Group I", group_id="CI"
    )


@pytest.fixture
def groupOther():
    return GroupFactory.create(
        id=11, name="Other", annex="unknown", name_alt="Other", group_id="uncontrolled"
    )


@pytest.fixture
def substance(excluded_usage, groupA, time_frames):
    substance = SubstanceFactory.create(
        name="HCFC-substance0",
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
def substance_hcfc(excluded_usage, groupHCFC, time_frames):
    substance = SubstanceFactory.create(
        name="HCFC-substance",
        sort_order=1,
        group=groupHCFC,
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
def blend_component(blend, substance_hcfc):
    blend.components.create(substance=substance_hcfc, percentage=0.5)


@pytest.fixture
def project_type():
    return ProjectTypeFactory.create(name="Project Type", code="PT", sort_order=1)


@pytest.fixture
def new_project_type():
    return ProjectTypeFactory.create(code="NewType")


@pytest.fixture
def project_status():
    return ProjectStatusFactory.create(name="Project Status", code="PS")


@pytest.fixture
def project_ongoing_status():
    return ProjectStatusFactory.create(name="Ongoing", code="ONG")


@pytest.fixture
def project_completed_status():
    return ProjectStatusFactory.create(name="Completed", code="COM")


@pytest.fixture
def project_closed_status():
    return ProjectStatusFactory.create(name="Closed", code="CLO")


@pytest.fixture
def submitted_status():
    return ProjectStatusFactory.create(code="NA")


@pytest.fixture
def project_draft_status():
    return ProjectSubmissionStatusFactory.create(
        name="Draft", code="draft", color="#FF0000"
    )


@pytest.fixture
def project_submitted_status():
    return ProjectSubmissionStatusFactory.create(name="Submitted", code="")


@pytest.fixture
def project_recommended_status():
    return ProjectSubmissionStatusFactory.create(name="Recommended", code="")


@pytest.fixture
def project_not_approved_status():
    return ProjectSubmissionStatusFactory.create(name="Not approved", code="")


@pytest.fixture
def project_approved_status():
    return ProjectSubmissionStatusFactory.create(name="Approved", code="approved")


@pytest.fixture
def sector():
    return ProjectSectorFactory.create(name="Sector", code="SEC", sort_order=1)


@pytest.fixture
def subsector(sector):
    subsector = ProjectSubSectorFactory.create(
        name="Subsector", code="SUB", sort_order=1
    )
    subsector.sectors.add(sector)
    return subsector


@pytest.fixture
def sector_other():
    return ProjectSectorFactory.create(name="Other", code="OTH", sort_order=2)


@pytest.fixture
def subsector_other_sector_other(sector_other):
    subsector = ProjectSubSectorFactory.create(name="Other", code="OTH")
    subsector.sectors.add(sector_other)
    return subsector


@pytest.fixture
def subsector_other(sector):
    subsector = ProjectSubSectorFactory.create(
        name=f"Other {sector.name}", code=f"OTH{sector.code}"
    )
    subsector.sectors.add(sector)
    return subsector


@pytest.fixture
def new_sector():
    return ProjectSectorFactory.create(name="New Sector")


@pytest.fixture
def rbm_measure():
    return RbmMeasureFactory.create(name="RBM Measure", sort_order=1)


@pytest.fixture
def meeting():
    return MeetingFactory.create(number=1, date="2019-03-14", end_date="2019-03-15")


@pytest.fixture
def new_meeting():
    return MeetingFactory.create(number=3, date="2020-03-14")


@pytest.fixture
def decision(meeting):
    return DecisionFactory.create(number=1, meeting=meeting)


@pytest.fixture
def project_cluster_kpp(groupHCFC):
    cluster = ProjectClusterFactory.create(name="KPP1", code="KPP1", sort_order=1)
    cluster.annex_groups.add(groupHCFC)
    return cluster


@pytest.fixture
def project_cluster_kip(groupHCFC):
    cluster = ProjectClusterFactory.create(name="KIP1", code="KIP1", sort_order=2)
    cluster.annex_groups.add(groupHCFC)
    return cluster


@pytest.fixture
def meta_project(country_ro, project_cluster_kpp):
    return MetaProjectFactory.create()


@pytest.fixture
def meta_project_mya(country_ro, project_cluster_kip):
    return MetaProjectFactory.create(type="Multi-year agreement")


@pytest.fixture(name="project_url")
def _project_url(project):
    return reverse("project-v2-detail", args=(project.id,))


@pytest.fixture(name="project_upload_url")
def _project_upload_url(project):
    return reverse("project-upload", args=(project.id,))


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "scott.txt"
    p.write_text("Living on a Prayer!")
    return p


@pytest.fixture(name="project_file")
def _project_file(project, test_file):
    project_file = ProjectFile(project=project)
    project_file.file.save("scott.txt", test_file.open())
    project_file.save()
    return project_file


@pytest.fixture(name="project2_file")
def _project2_file(project2, test_file):
    project_file = ProjectFile(project=project2)
    project_file.file.save("scott.txt", test_file.open())
    project_file.save()
    return project_file


@pytest.fixture(name="project3_file")
def _project3_file(project3, test_file):
    project_file = ProjectFile(project=project3)
    project_file.file.save("project3_text.txt", test_file.open())
    project_file.save()
    return project_file


@pytest.fixture(name="test_file1")
def _test_file1(tmp_path):
    p = tmp_path / "project_file1.docx"
    p.write_text("This is the first project test file")
    return p


@pytest.fixture(name="test_file2")
def _test_file2(tmp_path):
    p = tmp_path / "project_file2.pdf"
    p.write_text("This is the second project test file")
    return p


@pytest.fixture(name="wrong_format_file3")
def _wrong_format_file3(tmp_path):
    p = tmp_path / "project_file3.zip"
    p.write_text("This is the third project test file")
    return p


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
        serial_number=1,
    )
    return project


@pytest.fixture
def approved_project(
    project,
    project_approved_status,
):
    project.submission_status = project_approved_status
    project.version = 3
    project.code = get_project_sub_code(
        project.country,
        project.cluster,
        project.agency,
        project.project_type,
        project.sector,
        project.meeting,
        None,
    )
    project.save()
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
        version=1,
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
    return BPChemicalTypeFactory(name="BPChemicalType", obsolete=False)


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
    substance_hcfc,
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
        "substances": [substance_hcfc.id],
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


@pytest.fixture(name="_setup_project_list")
def setup_project_list(
    country_ro,
    agency,
    new_agency,
    new_country,
    project_type,
    new_project_type,
    project_status,
    submitted_status,
    project_draft_status,
    project_submitted_status,
    project_approved_status,
    subsector,
    meeting,
    new_meeting,
    sector,
    new_sector,
    project_cluster_kpp,
    project_cluster_kip,
):
    new_subsector = ProjectSubSectorFactory.create(sectors=[new_sector])
    projects = []
    projects_data = [
        {
            "country": country_ro,
            "agency": agency,
            "project_type": project_type,
            "status": project_status,
            "submission_status": project_draft_status,
            "sector": sector,
            "subsectors": [subsector],
            "substance_type": "HCFC",
            "meeting": meeting,
            "cluster": project_cluster_kpp,
        },
        {
            "country": new_country,
            "agency": new_agency,
            "project_type": new_project_type,
            "status": submitted_status,
            "submission_status": project_submitted_status,
            "sector": new_sector,
            "subsectors": [new_subsector],
            "substance_type": "CFC",
            "meeting": new_meeting,
            "cluster": project_cluster_kip,
        },
    ]

    for i in range(4):
        for project_data in projects_data:
            project_data["code"] = get_project_sub_code(
                project_data["country"],
                project_data["cluster"],
                project_data["agency"],
                project_data["project_type"],
                project_data["sector"],
                project_data["meeting"],
                project_data["meeting"],
                i + 1,
            )

            ProjectFactory.create(
                title=f"Project {i}",
                serial_number=i + 1,
                **project_data,
            )

    # project_without cluster
    proj_data = projects_data[0].copy()
    proj_data.pop("cluster")
    proj_data["code"] = get_project_sub_code(
        proj_data["country"],
        None,
        project_data["agency"],
        project_data["project_type"],
        project_data["sector"],
        project_data["meeting"],
        project_data["meeting"],
        25,
    )
    projects.append(
        ProjectFactory.create(
            title="Project 25",
            **proj_data,
        )
    )

    # project_without sector and subsector
    proj_data = projects_data[0].copy()
    proj_data["sector"] = None
    proj_data["subsectors"] = None
    proj_data["code"] = get_project_sub_code(
        proj_data["country"],
        proj_data["cluster"],
        project_data["agency"],
        project_data["project_type"],
        project_data["sector"],
        project_data["meeting"],
        project_data["meeting"],
        26,
    )
    projects.append(
        ProjectFactory.create(
            title="Project 26",
            serial_number=26,
            **proj_data,
        )
    )

    proj_data = projects_data[0].copy()
    proj_data["production"] = True

    projects.append(
        ProjectFactory.create(
            title="Project 27",
            serial_number=27,
            **proj_data,
        )
    )

    proj_data["production"] = False
    proj_data["version"] = 2
    proj_data["submission_status"] = project_submitted_status
    projects.append(
        ProjectFactory.create(
            title="Project 28",
            serial_number=28,
            **proj_data,
        )
    )

    proj_data["version"] = 3
    proj_data["submission_status"] = project_approved_status
    projects.append(
        ProjectFactory.create(
            title="Project 29",
            serial_number=29,
            **proj_data,
        )
    )

    return projects


@pytest.fixture
def apr_year():
    return 2024


@pytest.fixture
def annual_progress_report(apr_year):
    return AnnualProgressReportFactory(year=apr_year, endorsed=False)


@pytest.fixture
def annual_progress_report_endorsed(apr_year, meeting_apr_same_year):
    return AnnualProgressReportFactory(
        year=apr_year,
        endorsed=True,
        date_endorsed=timezone.now().date(),
        meeting_endorsed=meeting_apr_same_year,
        remarks_endorsed="Test endorsement",
    )


@pytest.fixture
def annual_agency_report(annual_progress_report, agency, agency_viewer_user):
    return AnnualAgencyProjectReportFactory(
        progress_report=annual_progress_report,
        agency=agency,
        is_unlocked=False,
        created_by=agency_viewer_user,
    )


@pytest.fixture
def annual_project_report(annual_agency_report, approved_project):
    return AnnualProjectReportFactory(
        report=annual_agency_report,
        project=approved_project,
    )


@pytest.fixture
def multiple_projects_for_apr(
    agency, country_ro, sector, project_ongoing_status, project_completed_status
):
    ongoing_projects = [
        ProjectFactory(
            agency=agency,
            country=country_ro,
            sector=sector,
            status=project_ongoing_status,
            date_approved=date(2022, 1, 1),
            code=f"TEST/ONG/{i}/INV/01",
            version=3,
        )
        for i in range(1, 4)
    ]

    completed_projects = [
        ProjectFactory(
            agency=agency,
            country=country_ro,
            sector=sector,
            status=project_completed_status,
            date_approved=date(2021, 6, 1),
            code=f"TEST/COM/{i}/INV/01",
            version=3,
        )
        for i in range(1, 3)
    ]

    return ongoing_projects + completed_projects


@pytest.fixture
def multiple_meetings_apr_same_year(apr_year):
    return [
        MeetingFactory.create(
            number=10 + i,
            date=date(apr_year, i, 14),
            end_date=date(apr_year, i, 15),
        )
        for i in range(1, 3)
    ]


@pytest.fixture
def meeting_apr_previous_year(apr_year):
    return MeetingFactory.create(
        number=39,
        date=date(apr_year - 1, 4, 14),
        end_date=date(apr_year - 1, 4, 15),
    )


@pytest.fixture
def meeting_apr_same_year(apr_year):
    return MeetingFactory.create(
        number=29,
        date=date(apr_year, 4, 14),
        end_date=date(apr_year, 4, 15),
    )


@pytest.fixture
def meeting_apr_next_year(apr_year):
    return MeetingFactory.create(
        number=19,
        date=date(apr_year + 1, 4, 14),
        end_date=date(apr_year + 1, 4, 15),
    )


@pytest.fixture
def multiple_decisions_apr_same_year(multiple_meetings_apr_same_year):
    return [
        DecisionFactory.create(number=10 + i, meeting=meeting)
        for (i, meeting) in enumerate(multiple_meetings_apr_same_year)
    ]


@pytest.fixture
def decision_apr_previous_year(meeting_apr_previous_year):
    return DecisionFactory.create(number=39, meeting=meeting_apr_previous_year)


@pytest.fixture
def decision_apr_same_year(meeting_apr_same_year):
    return DecisionFactory.create(number=29, meeting=meeting_apr_same_year)


@pytest.fixture
def decision_apr_next_year(meeting_apr_next_year):
    return DecisionFactory.create(number=19, meeting=meeting_apr_next_year)


@pytest.fixture
def initial_project_version_for_apr(agency, country_ro, sector, project_ongoing_status):
    return ProjectFactory(
        agency=agency,
        country=country_ro,
        sector=sector,
        status=project_ongoing_status,
        date_approved=date(2021, 6, 1),
        code="TEST/INITIAL/V3/01",
        version=3,
        total_fund=100000.0,
        support_cost_psc=10000.0,
    )


@pytest.fixture
def initial_project_version_2_for_apr(
    agency, country_ro, sector, project_ongoing_status
):
    return ProjectFactory(
        agency=agency,
        country=country_ro,
        sector=sector,
        status=project_ongoing_status,
        date_approved=date(2021, 6, 1),
        code="TEST/INITIAL/V2/01",
        version=2,
        total_fund=100000.0,
        support_cost_psc=10000.0,
    )


@pytest.fixture
def multiple_project_versions_for_apr(
    agency,
    country_ro,
    sector,
    project_ongoing_status,
    multiple_decisions_apr_same_year,
    substance,
):
    post_excom_versions = [
        ProjectFactory(
            agency=agency,
            country=country_ro,
            sector=sector,
            status=project_ongoing_status,
            date_approved=date(2021, 6, 1),
            date_completion=date(2026, 5, 3),
            code="TEST/COM/MULT/01",
            version=i + 3,
            post_excom_decision=decision,
            total_fund=100000.0 + i * 25000.0,
            support_cost_psc=10000.0 + i * 2500.0,
        )
        for (i, decision) in enumerate(multiple_decisions_apr_same_year, start=1)
    ]
    final_version = post_excom_versions[-1]
    initial_version = ProjectFactory(
        agency=agency,
        country=country_ro,
        sector=sector,
        status=project_ongoing_status,
        date_approved=date(2021, 6, 1),
        date_completion=date(2026, 5, 1),
        code="TEST/COM/MULT/01",
        version=3,
        post_excom_decision=None,
        latest_project=final_version,
        total_fund=100000.0,
        support_cost_psc=10000.0,
    )
    for version in post_excom_versions[:-1]:
        version.latest_project = final_version
        version.save()

    for i, version in enumerate([initial_version] + post_excom_versions, start=1):
        # Adding production and consumption for each project
        ProjectOdsOdpFactory(
            project=version,
            ods_substance=substance,
            odp=0.02 + i,
            co2_mt=0.05 + i,
            phase_out_mt=0.15 + i,
            ods_type=ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION,
            sort_order=1,
        )
        ProjectOdsOdpFactory(
            project=version,
            ods_substance=substance,
            odp=0.02 + i,
            co2_mt=0.05 + i,
            phase_out_mt=0.15 + i,
            ods_type=ProjectOdsOdp.ProjectOdsOdpType.OTHER,
            sort_order=1,
        )

    return [initial_version] + post_excom_versions


@pytest.fixture
def late_post_excom_versions_for_apr(
    decision_apr_next_year, agency, country_ro, sector, project_ongoing_status
):
    later_version = ProjectFactory(
        agency=agency,
        country=country_ro,
        sector=sector,
        status=project_ongoing_status,
        date_approved=date(2021, 6, 1),
        code="TEST/LATE/FUTURE/01",
        version=4,
        latest_project=None,
        post_excom_decision=decision_apr_next_year,
        total_fund=200000.0,
        support_cost_psc=20000.0,
    )
    initial_version = ProjectFactory(
        agency=agency,
        country=country_ro,
        sector=sector,
        status=project_ongoing_status,
        date_approved=date(2021, 6, 1),
        code="TEST/LATE/FUTURE/01",
        version=3,
        latest_project=later_version,
        post_excom_decision=None,
        total_fund=100000.0,
        support_cost_psc=10000.0,
    )

    return [initial_version, later_version]


@pytest.fixture()
def mock_send_agency_submission_notification():
    with patch("core.tasks.send_agency_submission_notification.delay") as send_mail:
        yield send_mail
