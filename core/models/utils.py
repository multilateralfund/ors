from django.db import models


class SubstancesType(models.TextChoices):
    HCFC = "HCFC", "HCFC"
    HFC = "HFC", "HFC"
    HFC_Plus = "HFC_Plus", "HFC_Plus"
