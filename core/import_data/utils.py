from core.models.blend import Blend, BlendAltName, BlendComponents
from core.models.country_programme import CountryProgrammeReport, CountryProgrammeRecord
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

CHEMICAL_NAME_MAPPING = {
    "R-125 (65.1%), R-134a  -  (31.5%)": "R-422D",
}


def parse_string(string_value):
    """
    remove white spaces and convert to lower case
    """
    if not string_value:
        return None

    return string_value.strip().lower()


def delete_old_cp_records(source, logger):
    """
    delete old records from db
    @param source: string source name
    @param logger: logger object
    """
    CountryProgrammeRecord.objects.filter(
        source_file__iexact=source.lower()
    ).all().delete()
    logger.info(f"✔ old records from {source} deleted")


def get_substance_by_name(substance_name):
    """
    get substance by name or alt name (case insensitive)
    @param substance_name: string subsance name

    @return: Substance object
    """
    if not substance_name:
        return None

    substance = Substance.objects.get_by_name(substance_name).first()
    if substance:
        return substance

    substance = SubstanceAltName.objects.get_by_name(substance_name).first()
    if substance:
        return substance.substance

    return None


def get_blend_by_name(blend_name):
    """
    get blend by name or alt name (case insensitive)
    @param blend_name: string blend name

    @return: int blend id
    """
    if not blend_name:
        return None

    blend = Blend.objects.get_by_name(blend_name).first()
    if blend:
        return blend

    blend = BlendAltName.objects.get_by_name(blend_name).first()
    if blend:
        return blend.blend

    return None


def get_blend_by_name_or_components(blend_name, components):
    """
    get blend by name or components
    @param blend_name: string blend name
    @param components: list of tuples (substance_name, percentage)

    @return: int blend id
    """
    blend = get_blend_by_name(blend_name)
    if blend:
        return blend

    if components:
        subst_prcnt = []
        for substance_name, percentage in components:
            try:
                subst = get_substance_by_name(substance_name)
                if not subst:
                    return None
                prcnt = float(percentage) / 100
                subst_prcnt.append((subst, prcnt))
            except ValueError:
                return None

        blend = BlendComponents.objects.get_blend_by_components(subst_prcnt)

    return blend


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


def get_object_by_name(cls, obj_name, index_row, obj_type_name, logger):
    """
    get object by name or log error if not found in db
    @param cls: Class instance
    @param obj_name: string -> object name (filter value)
    @param index_row: integer -> index row
    @param obj_type_name: string -> object type name (for logging)
    @param logger: logger object

    @return: object or None
    """
    if not obj_name:
        return None
    obj = cls.objects.get_by_name(obj_name).first()
    if not obj:
        logger.info(
            f"[row: {index_row}]: This {obj_type_name} does not exists in data base: {obj_name}"
        )

    return obj


def check_empty_row(row, index_row, quantity_columns, logger):
    """
    check if the row has negative values and if it's empty
    @param row = pandas series
    @param index_row = int
    @param usage_dict = dict (column_name: Usage obj)

    @return boolean (True if the row is empty)
    """
    # check if the row is empty
    is_empty = True
    negative_values = []
    for colummn_name in quantity_columns:
        if row.get(colummn_name, None):
            is_empty = False
            # check if the value is negative
            if isinstance(row[colummn_name], (int, float)) and row[colummn_name] < 0:
                negative_values.append(colummn_name)
    # log negative values
    if negative_values:
        logger.warning(
            f"⚠️ [row: {index_row}] "
            f"The following columns have negative values: {negative_values}"
        )
    return is_empty
