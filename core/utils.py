# pylint: disable=R0913

# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
from core.models.project import MetaProject, Project

from django.db.models import Q

IMPORT_DB_MAX_YEAR = 2018
# the records from 95-04 are the oldest records that we have
# we only have data for section A
IMPORT_DB_OLDEST_MAX_YEAR = 2004

# the min year for the cp reports to be validated
VALIDATION_MIN_YEAR = 2023


def get_meta_project_code(country, cluster, serial_number=None):
    """
    Get a new meta project code for a country
    """
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    if not serial_number:
        prefix = f"{country_code}/"
        serials = []
        metacodes = (
            Project.objects.filter(
                metacode__startswith=prefix,
            )
            .filter(
                Q(meta_project__is_draft=False) | Q(meta_project__isnull=True),
            )
            .values_list("metacode", flat=True)
        )
        for metacode in metacodes:
            try:
                serial = int(metacode.split("/")[2])
                serials.append(serial)
            except (IndexError, ValueError):
                continue
        serial_number = 1
        if serials:
            serial_number = max(serials) + 1

    return f"{country_code}/{cluster_code}/{serial_number}"


def get_draft_meta_project_code(country, cluster):
    """
    Get a new draft meta project code for a country/cluster combination.
    """
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"

    prefix = f"{country_code}/"
    serials = []

    metacodes = (
        Project.objects.filter(
            metacode__startswith=prefix,
        )
        .filter(
            Q(meta_project__is_draft=True) | Q(meta_project__isnull=True),
        )
        .values_list("metacode", flat=True)
    )
    for metacode in metacodes:
        try:
            serial = int(metacode.split("/")[3])
            serials.append(serial)
        except (IndexError, ValueError):
            continue
    serial_number = 1
    if serials:
        serial_number = max(serials) + 1
    return f"{country_code}/{cluster_code}/TEMP/{serial_number}"


def get_project_sub_code(
    country,
    cluster,
    agency,
    project_type,
    sector,
    meeting_appr,
    serial_number=None,
    metacode=None,
):
    """
    Get a new project sub code

    @param country: Country
    @param cluster: Cluster
    @param agency: Agency
    @param project_type: ProjectType
    @param sector: Sector
    @param meeting_appr: Meeting
    @param serial_number: int

    @return: str

    """
    agency_code = agency.code or agency.name if agency else "-"
    project_type_code = project_type.code if project_type else "-"
    sector_code = sector.code if sector else "-"
    meeting_appr_code = meeting_appr.number if meeting_appr else "-"
    meetings_code = f"{meeting_appr_code}"
    if not serial_number:
        serial_number = Project.objects.get_next_serial_number(country.id)
    if not metacode:
        country_code = country.iso3 or country.abbr if country else "-"
        cluster_code = cluster.code if cluster else "-"
        return (
            f"{country_code}/{cluster_code}/{serial_number}/{agency_code}/{project_type_code}/"
            f"{sector_code}/{meetings_code}"
        )
    metacode_parts = metacode.split("/")
    metacode_prefix = "/".join(metacode_parts[0:2])  # country_code/cluster_code
    return (
        f"{metacode_prefix}/{serial_number}/{agency_code}/{project_type_code}/"
        f"{sector_code}/{meetings_code}"
    )


def get_meta_project(project):
    """
    Get the correct meta project for a new project. The function checks the following in order:
     1. If the project has a component, return the meta project of the component.
     2. If the project is a MYA project, return the meta project for the country and cluster.
        If no meta project is found, create a new draft meta project and return it.
        The draft meta project will be converted to a final meta project when the project is approved.
     3. If the project is IND create a new draft meta project for the country and cluster and return it.
        The draft meta project will be converted to a final meta project when the project is approved.
    """
    if project.component:
        meta_project = MetaProject.objects.filter(
            projects__component=project.component
        ).first()
        if meta_project:
            return meta_project
    if project.category == Project.Category.MYA:
        meta_project = MetaProject.objects.filter(
            country=project.country,
            cluster=project.cluster,
            type=Project.Category.MYA,
        ).first()
        if meta_project:
            return meta_project
        return MetaProject.objects.create(
            country=project.country,
            cluster=project.cluster,
            type=Project.Category.MYA,
            umbrella_code=get_draft_meta_project_code(
                project.country,
                project.cluster,
            ),
            is_draft=True,
        )
    return None


def post_approval_changes(project):
    """
    Generate project code and meta code when a project is approved.
    Approve a draft meta project if one is linked to the project and generate
    its permanent meta code.
    """
    if project.meta_project and project.meta_project.is_draft:
        project.meta_project.is_draft = False
        project.meta_project.umbrella_code = get_meta_project_code(
            project.country,
            project.cluster,
        )
        project.meta_project.save()

    if project.meta_project:
        project.metacode = project.meta_project.umbrella_code
    else:
        project.metacode = get_meta_project_code(
            project.country,
            project.cluster,
        )
    # generate project code
    project.code = get_project_sub_code(
        project.country,
        project.cluster,
        project.agency,
        project.project_type,
        project.sector,
        project.meeting,
        project.serial_number,
        project.metacode,
    )
    project.save()
    return project
