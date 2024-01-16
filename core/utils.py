# pylint: disable=R0913

# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
IMPORT_DB_MAX_YEAR = 2018
# the records from 95-04 are the oldest records that we have
# we only have data for section A
IMPORT_DB_OLDEST_MAX_YEAR = 2004


def get_meta_project_code(country, cluster, serial_number):
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    sn = serial_number or "-"
    return f"{country_code}/{cluster_code}/{sn}"


def get_project_sub_code(
    country,
    cluster,
    serial_number,
    agency,
    project_type,
    sector,
    meeting_appr,
    meeting_transf,
):
    meta_code = get_meta_project_code(country, cluster, serial_number)
    agency_code = agency.code or agency.name if agency else "-"
    project_type_code = project_type.code if project_type else "-"
    sector_code = sector.code if sector else "-"
    meeting_appr_code = meeting_appr.number if meeting_appr else "-"
    meeting_transf_code = "." + meeting_transf.number if meeting_transf else ""
    meetins_code = f"{meeting_appr_code}{meeting_transf_code}"
    return (
        f"{meta_code}/{agency_code}/{project_type_code}/"
        f"{sector_code}/{meetins_code}"
    )
