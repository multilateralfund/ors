from decimal import Decimal

import pandas as pd

from core.models import Replenishment
from core.import_data.utils import IMPORT_RESOURCES_DIR


REPLENISHMENT_YEARS = [(year, year + 2) for year in range(1991, 2022, 3)]


def import_replenishments():
    """
    Import past replenishments (1991 - 2021).

    >= 2008 row 8 is the header row
    else row 7 is the header row
    """
    replenishments_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9303p2.xlsx")
    for start_year, end_year in REPLENISHMENT_YEARS:
        sheet = f"YR{start_year}_{end_year.__str__()[-2:]}"
        df = pd.read_excel(
            replenishments_file,
            sheet_name=sheet,
            skiprows=7 if start_year >= 2006 else 6,
            header=0,
            converters={"Agreed Contributions": lambda x: Decimal(x) if x else x},
        )

        condition = df["Party"].map(
            lambda x: isinstance(x, str) and x.strip().upper() == "TOTAL"
        )
        print(df[condition][-1:]["Agreed Contributions"].dtype)
        # replenishment = Replenishment(start_year=start_year, end_year=end_year)
