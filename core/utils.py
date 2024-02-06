# pylint: disable=R0913

# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
from core.models.project import Project


IMPORT_DB_MAX_YEAR = 2018
# the records from 95-04 are the oldest records that we have
# we only have data for section A
IMPORT_DB_OLDEST_MAX_YEAR = 2004


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


def get_project_sub_code(country, cluster, serial_number=None):
    """
    Get a new project sub code for a country and a cluster
    """
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    if not serial_number:
        serial_number = Project.objects.get_next_serial_number(country.id)
    return f"{country_code}/{cluster_code}/{serial_number}"
