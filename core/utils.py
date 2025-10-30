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


def get_umbrella_code(country):
    country_code = country.iso3 or country.abbr
    prefix = f"meta/{country_code}/"
    serials = []

    umbrellas = MetaProject.objects.filter(
        umbrella_code__startswith=prefix
    ).values_list("umbrella_code", flat=True)
    for umb in umbrellas:
        try:
            serial = int(umb.split("/")[-1])
            serials.append(serial)
        except (IndexError, ValueError):
            continue
    serial_number = 1
    if serials:
        serial_number = max(serials) + 1
    return f"meta/{country_code}/{serial_number:08d}"


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
    if not serial_number:
        serial_number = Project.objects.get_next_serial_number(country.id)

    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    agency_code = agency.code or agency.name if agency else "-"
    project_type_code = project_type.code if project_type else "-"
    sector_code = sector.code if sector else "-"
    meeting_appr_code = meeting_appr.number if meeting_appr else "-"
    meeting_transf_code = f".{meeting_transf.number}" if meeting_transf else ""
    meetings_code = f"{meeting_appr_code}{meeting_transf_code}"
    return (
        f"{country_code}/{cluster_code}/{serial_number}/{agency_code}/{project_type_code}/"
        f"{sector_code}/{meetings_code}"
    )


def generate_project_metacode(project):
    """
    Get the metacode for a project.
    Still TBD, but right now the metacode is the same only for components.
    The project category will most likely also play a role in defining the metacode.
    """
    component = getattr(project, "component", None)
    if component:
        existing_metacode = (
            Project.objects.filter(component=component, metacode__isnull=False)
            .values_list("metacode", flat=True)
            .first()
        )
        if existing_metacode:
            return existing_metacode
    metacode = get_meta_project_code(
        project.country,
        project.cluster,
    )
    return metacode


def post_approval_changes(project):
    """
    Generate project code and meta code when a project is approved.
    Create an umbrella project (meta project) only if the project has components
    (even if the components are not approved yet).
    """
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
    )

    # generate or retrieve meta code
    project.metacode = generate_project_metacode(project)
    project.save()

    # create meta project (if required)
    if not project.component:
        return

    meta_project = MetaProject.objects.filter(
        projects__component=project.component
    ).first()
    if not meta_project:
        meta_project = MetaProject.objects.create(
            umbrella_code=get_umbrella_code(project.country), type=project.project_type
        )
    project.meta_project = meta_project
    project.save()
