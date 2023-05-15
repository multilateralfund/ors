from core.models.country_programme import CountryProgrammeReport
from core.models.record import Record
from core.models.substance import Substance, SubstanceAltName


COUNTRY_NAME_MAPPING = {
    "Brunei Darussalan": "Brunei Darussalam",
    "Cap Verde": "Cabo Verde",
    "Czech Republic": "Czechia",
    "Eswatini (the Kingdom of)": "Eswatini",
    "Federated States of Micronesia": "Micronesia (Federated States of)",
    "Lao, PDR": "Lao PDR",
    "SAO TOME ET PRINCIPE": "Sao Tome and Principe",
    "Turkiye": "Turkey",
    "USA": "United States of America",
    "Western Samoa": "Samoa",
}

SUBSECTOR_NAME_MAPPING = {
    "HFC phase-down plan": "HFC phase down plan",
}

USAGE_NAME_MAPPING = {
    "Aerosal": "Aerosol",
    "FireFighting": "Fire fighting",
    "ProcessAgent": "Process agent",
    "LabUse": "Lab use",
    "NoneQPS": "Non-QPS",
    "TobaccoFluffing": "Tobacco fluffing",
}


def parse_string(str):
    """
    remove white spaces and convert to lower case
    """
    if not str:
        return None

    return str.strip().lower()


def delete_old_records(source, logger):
    """
    delete old records from db
    @param source: string source name
    @param logger: logger object
    """
    Record.objects.filter(source__iexact=source.lower()).all().delete()
    logger.info(f"✔ old records from {source} deleted")


def get_substance_id_by_name(substance_name):
    """
    get substance id by name or alt name (case insensitive)
    @param substance_name: string subsance name

    @return: int substance id
    """
    substance = Substance.objects.get_by_name(substance_name).first()
    if substance:
        return substance.id

    substance = SubstanceAltName.objects.get_by_name(substance_name).first()
    if substance:
        return substance.substance_id

    return None


def get_cp_report(year, country_name, country_id):
    """
    get or create country program report object by year and country
    @param year = int
    @param country_name = string
    @param country_id = int

    @return country_program = CountryProgrammeReport object
    """
    cp_name = f"{country_name} {year}"
    cp, _ = CountryProgrammeReport.objects.get_or_create(
        name=cp_name, year=year, country_id=country_id
    )

    return cp
