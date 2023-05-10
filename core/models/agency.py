from django.db import models


class AgencyManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.strip().lower()
        return self.filter(name__iexact=name_str)


class Agency(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    objects = AgencyManager()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Agencies"
