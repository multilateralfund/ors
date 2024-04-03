from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    country = models.ForeignKey(
        "Country", null=True, blank=True, on_delete=models.CASCADE
    )
    is_stakeholder = models.BooleanField(default=False)
    is_agency = models.BooleanField(default=False)
    is_country_user = models.BooleanField(default=False)
    is_secretariat = models.BooleanField(default=False)
