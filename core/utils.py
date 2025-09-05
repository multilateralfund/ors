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
        serial_number = (
            Project.objects.filter(country=country)
            .values("meta_project_id")
            .distinct()
            .count()
            + 1
        )
    return f"{country_code}/{cluster_code}/{serial_number}"


def get_meta_project_new_code(projects, meta_project=None):
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
    # If meta_project is provided and has a new_code, preserve existing clusters and update with current ones
    if meta_project and getattr(meta_project, "new_code", None):
        # Extract clusters from existing new_code
        parts = meta_project.new_code.split("/")
        if len(parts) >= 2:
            existing_clusters = parts[1].split("-")
            # Add new clusters and remove missing ones
            updated_clusters = [
                code for code in existing_clusters if code in clusters_codes
            ]
            # Add any new clusters not present before
            for code in clusters_codes:
                if code not in updated_clusters:
                    updated_clusters.append(code)
            clusters_codes = updated_clusters
    new_code_clusters = "-".join(clusters_codes)
    code_prefix = f"{country_code}/{new_code_clusters}"

    # Count existing MetaProjects with new_code starting with this prefix
    count = MetaProject.objects.filter(new_code__startswith=code_prefix).count()
    serial_number = count + 1
    return f"{code_prefix}/{serial_number}"


def regenerate_meta_project_new_code(meta_project):
    """
    Regenerate the new_code for a MetaProject based on its projects

    @param meta_project: MetaProject instance

    @return: str
    """
    projects = Project.objects.filter(
        meta_project=meta_project, submission_status__name="Approved"
    )
    new_code = get_meta_project_new_code(projects, meta_project)
    meta_project.new_code = new_code
    meta_project.save()


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
