# the max year for the cp reports to be imported
# if the year is greater than this value, the cp report will not be imported
IMPORT_DB_MAX_YEAR = 2018


def get_meta_project_code(country, cluster, serial_number):
    country_code = country.iso3 or country.abbr if country else "-"
    cluster_code = cluster.code if cluster else "-"
    sn = serial_number or "-"
    return f"{country_code}/{cluster_code}/{sn}"
