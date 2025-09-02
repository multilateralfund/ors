# pylint: disable=R0913

# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
from core.models.project import MetaProject, Project
from core.models.project_enterprise import ProjectEnterprise

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
        serial_number = (
            Project.objects.filter(country=country)
            .values("meta_project_id")
            .distinct()
            .count()
            + 1
        )
    return f"{country_code}/{cluster_code}/{serial_number}"


def get_meta_project_new_code(projects):
    """
    Get a new meta project code based on the existing projects

    @param projects: QuerySet of Project objects

    @return: str
    """
    country = projects[0].country if projects else None
    country_code = country.iso3 or country.abbr if country else "-"
    clusters_codes = sorted(
        list({getattr(project.cluster, "code", "-") for project in projects})
    )

    new_code_clusters = "/".join(clusters_codes)
    code_prefix = f"{country_code}/{new_code_clusters}"

    # Count existing MetaProjects with new_code starting with this prefix
    count = MetaProject.objects.filter(new_code__startswith=code_prefix).count()
    serial_number = count + 1
    return f"{code_prefix}/{serial_number}"


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


def get_enterprise_code(country, serial_number=None):
    """
    Get a new enterprise code for a project
    """
    if not serial_number:
        serial_number = ProjectEnterprise.objects.get_next_serial_number(country.id)
    country_code = country.iso3 or country.abbr if country else "-"
    return f"{country_code}/{serial_number}"
