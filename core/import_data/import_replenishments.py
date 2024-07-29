import decimal
import logging
from decimal import Decimal

import pandas as pd
from django.db import transaction

from core.models import Replenishment, ScaleOfAssessment, ScaleOfAssessmentVersion
from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
    delete_old_data,
)

logger = logging.getLogger(__name__)

COUNTRY_MAPPING = {
    "Czech Republic": "Czechia",
    "Slovak Republic": "Slovakia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
}

REPLENISHMENT_YEARS = [(2021, 2023), (2024, 2026)]
COUNTRY_COLUMN = 0
UN_SCALE_OF_ASSESSMENT_COLUMN = 1
ADJUSTED_SCALE_OF_ASSESSMENT_COLUMN = 2
CONTRIBUTION_COLUMN = 3
AVERAGE_INFLATION_RATE_COLUMN = 4
QUALIFIES_FOR_FIXED_RATE_MECHANISM_COLUMN = 5
FIXED_EXCHANGE_RATE_MECHANISM_COLUMN = 6
FIXED_EXCHANGE_RATE_CURRENCY_COLUMN = 7
FIXED_EXCHANGE_RATE_NATIONAL_CURRENCY_COLUMN = 8


def decimal_converter(value):
    try:
        return Decimal(str(value))
    except decimal.InvalidOperation:
        return None


def boolean_converter(value):
    if pd.isna(value) or value == "N/A" or value == "Not Available" or pd.isnull(value):
        return None
    if value in {"0", 0}:
        return False
    return bool(value)


def string_converter(value):
    if (
        pd.isna(value)
        or value.strip() == "N/A"
        or value.strip() == "Not Available"
        or pd.isnull(value)
    ):
        return "N/A"
    return str(value)


@transaction.atomic
def import_replenishments(countries):
    """
    Import past replenishments (2024-2026).
    """
    delete_old_data(ScaleOfAssessment)
    delete_old_data(ScaleOfAssessmentVersion)
    delete_old_data(Replenishment)

    for start_year, end_year in REPLENISHMENT_YEARS:
        scale_of_assessment_df = pd.read_excel(
            IMPORT_RESOURCES_DIR / f"Replenishment_{start_year}-{end_year}.xlsx",
            usecols="B:J",
            nrows=49,
            converters={
                0: string_converter,
                1: decimal_converter,
                2: decimal_converter,
                3: decimal_converter,
                4: decimal_converter,
                5: boolean_converter,
                6: decimal_converter,
                7: string_converter,
                8: decimal_converter,
            },
        )

        replenishment_amount = scale_of_assessment_df.iloc[:, CONTRIBUTION_COLUMN].sum()
        if start_year == 2024:
            replenishment_amount = replenishment_amount * Decimal("3")

        replenishment = Replenishment.objects.create(
            start_year=start_year,
            end_year=end_year,
            amount=replenishment_amount,
        )

        logger.info(f"Imported Replenishment {start_year} - {end_year}")
        scale_of_assessment_draft_version = ScaleOfAssessmentVersion.objects.create(
            replenishment=replenishment,
            version=0,
            is_final=False,
        )
        scale_of_assessment_final_version = ScaleOfAssessmentVersion.objects.create(
            replenishment=replenishment,
            version=1,
            is_final=True,
        )
        logger.info(f"Crated version 0 for Replenishment {start_year} - {end_year}")
        scales_of_assessment = []
        for _, row in scale_of_assessment_df.iterrows():
            country_name = row.iloc[COUNTRY_COLUMN].replace("\n", " ").strip()
            country = countries.get(COUNTRY_MAPPING.get(country_name, country_name))
            if not country:
                logger.warning(f"Country {country_name} not found")
                continue

            contribution_draft = ScaleOfAssessment(
                version=scale_of_assessment_draft_version,
                country=country,
                un_scale_of_assessment=row.iloc[UN_SCALE_OF_ASSESSMENT_COLUMN],
                override_adjusted_scale_of_assessment=row.iloc[
                    ADJUSTED_SCALE_OF_ASSESSMENT_COLUMN
                ],
                average_inflation_rate=row.iloc[AVERAGE_INFLATION_RATE_COLUMN],
                override_qualifies_for_fixed_rate_mechanism=row.iloc[
                    QUALIFIES_FOR_FIXED_RATE_MECHANISM_COLUMN
                ],
                exchange_rate=row.iloc[FIXED_EXCHANGE_RATE_MECHANISM_COLUMN],
                currency=row.iloc[FIXED_EXCHANGE_RATE_CURRENCY_COLUMN],
            )
            contribution_final = ScaleOfAssessment(
                version=scale_of_assessment_final_version,
                country=country,
                un_scale_of_assessment=row.iloc[UN_SCALE_OF_ASSESSMENT_COLUMN],
                override_adjusted_scale_of_assessment=row.iloc[
                    ADJUSTED_SCALE_OF_ASSESSMENT_COLUMN
                ],
                average_inflation_rate=row.iloc[AVERAGE_INFLATION_RATE_COLUMN],
                override_qualifies_for_fixed_rate_mechanism=row.iloc[
                    QUALIFIES_FOR_FIXED_RATE_MECHANISM_COLUMN
                ],
                exchange_rate=row.iloc[FIXED_EXCHANGE_RATE_MECHANISM_COLUMN],
                currency=row.iloc[FIXED_EXCHANGE_RATE_CURRENCY_COLUMN],
            )
            scales_of_assessment.append(contribution_draft)
            scales_of_assessment.append(contribution_final)

        ScaleOfAssessment.objects.bulk_create(scales_of_assessment)

        logger.info(
            f"Imported {len(scales_of_assessment)} scales of assessment for Replenishment {start_year} - {end_year}"
        )
