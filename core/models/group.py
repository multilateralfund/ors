from django.db import models


class Group(models.Model):
    group_id = models.CharField(max_length=64)
    annex = models.CharField(max_length=64)
    name = models.CharField(max_length=128, unique=True, default="")
    name_alt = models.CharField(max_length=128, blank=True, null=True)
    description = models.TextField()
    description_alt = models.TextField(null=True, blank=True)
    is_odp = models.BooleanField(default=True)
    is_gwp = models.BooleanField(default=False)
    ozone_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name
