from django.core.files.storage import storages
from django.db import models


class SubstancesType(models.TextChoices):
    CFC = "CFC", "CFC"
    HCFC = "HCFC", "HCFC"
    HFC = "HFC", "HFC"
    BOTH = "BOTH", "Both"
    METBR = "Methyl Bromide", "Methyl Bromide"
    HFC_Plus = "HFC_Plus", "HFC_Plus"


def get_protected_storage():
    return storages["protected"]
