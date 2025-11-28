# pylint: disable=R0913

# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
from core.models.project import MetaProject, Project

IMPORT_DB_MAX_YEAR = 2018
# the records from 95-04 are the oldest records that we have
# we only have data for section A
IMPORT_DB_OLDEST_MAX_YEAR = 2004

# the min year for the cp reports to be validated
VALIDATION_MIN_YEAR = 2023


def get_meta_project_code(country, cluster, serial_number=None):
    """
    Get a new meta project code for a country and a cluster
    """
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    if not serial_number:
        prefix = f"{country_code}/{cluster_code}/"
        serials = []

        metacodes = Project.objects.filter(metacode__startswith=prefix).values_list(
            "metacode", flat=True
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


def get_project_sub_code(
    country,
    cluster,
    agency,
    project_type,
    sector,
    meeting_appr,
    meeting_transf=None,
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
    @param meeting_transf: Meeting
    @param serial_number: int

    @return: str

    """
    agency_code = agency.code or agency.name if agency else "-"
    project_type_code = project_type.code if project_type else "-"
    sector_code = sector.code if sector else "-"
    meeting_appr_code = meeting_appr.number if meeting_appr else "-"
    meeting_transf_code = f".{meeting_transf.number}" if meeting_transf else ""
    meetings_code = f"{meeting_appr_code}{meeting_transf_code}"
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


def post_approval_changes(project):
    """
    Generate project code and meta code when a project is approved.
    Create an umbrella project (meta project) only if the project has components
    (even if the components are not approved yet).
    """

    # create meta project (if required)
    if project.component:
        meta_project = MetaProject.objects.filter(
            projects__component=project.component
        ).first()
        if not meta_project and project.category == Project.Category.MYA:
            meta_project = MetaProject.objects.filter(
                country=project.country,
                cluster=project.cluster,
                type=Project.Category.MYA,
            ).first()
        if not meta_project:
            meta_project = MetaProject.objects.create(
                umbrella_code=get_meta_project_code(
                    project.country,
                    project.cluster,
                ),
                country=project.country,
                cluster=project.cluster,
                type=project.category,
            )
        project.meta_project = meta_project
        project.save()
    elif project.category == Project.Category.MYA:
        # MYA projects must have a meta project to allow the update of the MYA fields
        # The system atempts to find an existing meta project for the country and cluster
        # if not found, a new one is created
        meta_project = MetaProject.objects.filter(
            country=project.country, cluster=project.cluster, type=Project.Category.MYA
        ).first()
        if not meta_project:
            meta_project = MetaProject.objects.create(
                country=project.country,
                cluster=project.cluster,
                type=Project.Category.MYA,
                umbrella_code=get_meta_project_code(
                    project.country,
                    project.cluster,
                ),
            )
        project.meta_project = meta_project
        project.save()

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
        project.transfer_meeting,
        project.serial_number,
        project.metacode,
    )
    project.serial_number = Project.objects.get_next_serial_number(project.country.id)
    project.save()
    return project
