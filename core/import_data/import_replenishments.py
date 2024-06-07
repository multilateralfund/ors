import logging
from decimal import Decimal

import pandas as pd

from core.models import Replenishment, Country, Contribution
from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
    delete_old_data,
    decimal_converter,
)

logger = logging.getLogger(__name__)


REPLENISHMENT_YEARS = [(year, year + 2) for year in range(1991, 2022, 3)]

COUNTRY_NAME_MAPPING = {
    "Czech Republic": "Czechia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "Slovak Republic": "Slovakia",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
}

UN_SCALES_NAME_MAPPING = {
    "Czech Republic": "Czechia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "Belarus (formerly Byelorussian Soviet Socialist Republic)": "Belarus",
    "Slovak Republic": "Slovakia",
    "Ukraine (formerly Ukrainian Soviet Socialist Republic)": "Ukraine",
}


def get_scales_of_assessment_data():
    un_scales_of_assessment = pd.read_excel(
        IMPORT_RESOURCES_DIR / "Scale of Assessments for RB 1946-2024.xlsx",
        header=None,
        dtype=str,
    )
    un_scales_of_assessment.dropna(how="all", inplace=True)
    header_rows = un_scales_of_assessment.iloc[:3]
    header = header_rows.apply(lambda x: " ".join(x.dropna().astype(str)), axis=0)
    un_scales_of_assessment = un_scales_of_assessment.iloc[4:]
    un_scales_of_assessment.columns = header

    scales_of_assessment_data = {}

    for _, row in un_scales_of_assessment.iterrows():
        if row["Member State"].strip().upper() == "TOTAL":
            break

        country_name_excel = (
            row["Member State"].replace("e/", "").replace("f/", "").strip()
        )
        country_name = UN_SCALES_NAME_MAPPING.get(
            country_name_excel, country_name_excel
        )
        scales_of_assessment_data[country_name] = {}

        for col_name, value in row.items():
            if (
                pd.isna(value)
                or col_name.strip() == ""
                or col_name.strip() == "Member State"
            ):
                continue

            # Years column
            years = [int(year) for year in col_name.strip().split(" ")]
            for year in years:
                scales_of_assessment_data[country_name][year] = Decimal(
                    value.strip().replace("-", "0").replace("b/", "0")
                )

    return scales_of_assessment_data


def import_replenishments():
    """
    Import past replenishments (1991 - 2021).

    >= 2008 row 8 is the header row
    else row 7 is the header row
    """
    delete_old_data(Contribution)
    delete_old_data(Replenishment)

    countries = {country.name: country for country in Country.objects.all()}

    replenishments_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9303p2.xlsx")
    un_scales_of_assessment_data = get_scales_of_assessment_data()

    for start_year, end_year in REPLENISHMENT_YEARS:
        sheet = f"YR{start_year}_{end_year.__str__()[-2:]}"
        replenishments_df = pd.read_excel(
            replenishments_file,
            sheet_name=sheet,
            skiprows=7 if start_year >= 2006 else 6,
            header=0,
            converters={
                "Agreed Contributions": decimal_converter,
                "Billateral Assistance": decimal_converter,
            },
        )

        only_total_rows = replenishments_df["Party"].map(
            lambda x: isinstance(x, str) and "TOTAL" in x.strip()
        )

        replenishment = Replenishment.objects.create(
            start_year=start_year,
            end_year=end_year,
            # Last total row is the total amount
            amount=replenishments_df[only_total_rows][-1:]["Agreed Contributions"].iloc[
                0
            ],
        )
        logger.info(f"Replenishment {start_year} - {end_year} imported")

        contributions = []
        contribution_end_index = replenishments_df[only_total_rows].index[0]
        contributions_df = replenishments_df[:contribution_end_index]

        for _, row in contributions_df.iterrows():
            country_name = row["Party"].replace("*", "").strip()
            current_country_name = COUNTRY_NAME_MAPPING.get(country_name, country_name)

            if current_country_name == "Holy See":
                logger.warning("Holy See is missing assessment data")

            un_scale_of_assessment_country_data = un_scales_of_assessment_data.get(
                current_country_name, {}
            )
            un_scale_of_assessment = (
                un_scale_of_assessment_country_data.get(start_year, 0)
                + un_scale_of_assessment_country_data.get(start_year + 1, 0)
                + un_scale_of_assessment_country_data.get(end_year, 0)
            ) / 3

            contributions.append(
                Contribution(
                    replenishment=replenishment,
                    country=countries[current_country_name],
                    paid_in_local_currency=False,
                    amount=row["Agreed Contributions"],
                    currency_of_payment="USD",
                    exchange_rate_six_months_prior=0,
                    bilateral_assistance_amount=row["Bilateral Assistance"],
                    un_scale_of_assessment=un_scale_of_assessment,
                    overridden_scale_of_assessment=0,
                    average_contributor_inflation_rate=0,
                    qualifies_for_fixed_rate_mechanism=False,
                )
            )

        Contribution.objects.bulk_create(contributions)
        logger.info(f"Contributions for {start_year} - {end_year} imported")
