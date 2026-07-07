from django.core.files.storage import storages
from django.db import models


SUBSTANCE_GROUP_ID_TO_CATEGORY = {
    "AI": "CFC",
    "AII": "Halon",
    "BI": "CFC",
    "BII": "CTC",
    "BIII": "TCA",
    "CI": "HCFC",
    "CII": "HBFC",
    "CIII": "Halon",
    "EI": "MBR",
    "F": "HFC",
    "uncontrolled": "Other",
    "legacy": "Legacy",
}


class SubstancesType(models.TextChoices):
    CFC = "CFC", "CFC"
    CFC_CTC = "CFC, CTC", "CFC, CTC"
    CFC_CTC_METBR = "CFC, CTC, Methyl Bromide", "CFC, CTC, Methyl Bromide"
    CFC_CTC_TCA = "CFC, CTC, TCA", "CFC, CTC, TCA"
    CFC_HALON = "CFC, Halon", "CFC, Halon"
    CFC_HALON_CTC = "CFC, Halon, CTC", "CFC, Halon, CTC"
    CFC_HALON_TCA = "CFC, Halon, TCA", "CFC, Halon, TCA"
    CFC_METBR = "CFC, Methyl Bromide", "CFC, Methyl Bromide"
    CFC_TCA = "CFC, TCA", "CFC, TCA"
    CTC = "CTC", "CTC"
    CTC_TCA = "CTC, TCA", "CTC, TCA"
    HALON = "Halon", "Halon"
    HFC = "HFC", "HFC"
    METBR = "Methyl Bromide", "Methyl Bromide"
    HCFC = "HCFC", "HCFC"
    NA = "N/A", "N/A"
    ODS = "ODS", "ODS"
    TCA = "TCA", "TCA"
    BOTH = "BOTH", "Both"
    HFC_Plus = "HFC_Plus", "HFC_Plus"


def get_protected_storage():
    return storages["protected"]
