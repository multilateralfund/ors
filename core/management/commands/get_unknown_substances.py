# -*- coding: utf-8 -*-
import logging
import os
import pandas as pd

from django.conf import settings
from django.core.management import BaseCommand

from core.models import Blend, Substance

logger = logging.getLogger(__name__)

CLS_STRINGS = (
    "grupo",
    "anexo",
    "group",
    "annex",
    "sustancias",
    "substances",
    "alternativas",
)

END_SUBS_LIST_STRING = ("total", "1 ")


def parse_sheet(df):
    unknown_subs = []
    for _, row in df.iterrows():
        # skip rows
        if pd.isna(row[0]):
            continue
        if row[0].lower().startswith(CLS_STRINGS):
            continue
        if row[0].lower() in ("subtotal", "sub-total"):
            continue
        # end of table
        if row[0].lower().startswith(END_SUBS_LIST_STRING):
            break

        # check blends
        if row[0].lower().startswith(("r-", "r‑")):
            # R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%)
            blend_name = row[0].split(" ", 1)[0].replace("‑", "-")
            if not Blend.objects.get_by_name(blend_name).first():
                unknown_subs.append(row[0])
            continue

        if row[0].lower().startswith("otras: "):
            # Otras: R-404A
            blend_name = row[0].split(" ")[1].replace("‑", "-")
            if not Blend.objects.get_by_name(blend_name).first():
                unknown_subs.append(row[0])
            continue

        if not Substance.objects.get_by_name(row[0]).first():
            unknown_subs.append(row[0])

    return unknown_subs


def parse_file(file_path):
    subs_A = parse_sheet(
        pd.read_excel(file_path, sheet_name=0, header=None, skiprows=range(11))
    )
    subs_B = parse_sheet(
        pd.read_excel(file_path, sheet_name=1, header=None, skiprows=range(10))
    )
    subs_C = parse_sheet(
        pd.read_excel(file_path, sheet_name=2, header=None, skiprows=range(5))
    )

    return {
        "sheet_A": subs_A,
        "sheet_B": subs_B,
        "sheet_C": subs_C,
    }


def get_unknown_substances_from_file(file_path, file_name):
    logger.info(f"Unknown substances from: {file_name}")
    unknown_subs = parse_file(file_path)
    unknown_subs_set = set()
    for k in unknown_subs:
        logger.info((k, len(unknown_subs[k]), unknown_subs[k]))
        unknown_subs_set.update(unknown_subs[k])
    return unknown_subs_set


def parse_directory(dir_path):
    unknown_subs_set = set()
    for file_name in os.listdir(dir_path):
        file_path = os.path.join(dir_path, file_name)
        unknown_subs = get_unknown_substances_from_file(file_path, file_name)
        unknown_subs_set.update(unknown_subs)
    logger.info(
        ("Final list of unknown substances", len(unknown_subs_set), unknown_subs_set)
    )


class Command(BaseCommand):
    help = "Get a list of unkown substances from xlsx files"

    def handle(self, *args, **kwargs):
        dir_path = settings.ROOT_DIR / "import_data/records"
        parse_directory(dir_path)
