from django.db import models


class AgencyManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


class Agency(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    objects = AgencyManager()

    class Meta:
        verbose_name_plural = "Agencies"

    def __str__(self):
        return self.name
