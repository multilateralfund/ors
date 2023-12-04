from django.db import models


class AgencyManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


class Agency(models.Model):
    class AgencyType(models.TextChoices):
        AGENCY = "Agency", "Agency"
        NATIONAL = "National", "National"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=16, null=True, blank=True)
    agency_type = models.CharField(
        max_length=16, choices=AgencyType.choices, default=AgencyType.AGENCY
    )

    objects = AgencyManager()

    class Meta:
        verbose_name_plural = "Agencies"

    def __str__(self):
        return self.name
