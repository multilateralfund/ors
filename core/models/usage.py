from django.db import models


class UsageManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(full_name__iexact=name_str)
        )


class Usage(models.Model):
    name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=248)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    code = models.CharField(max_length=10, null=True, blank=True)

    objects = UsageManager()

    def __str__(self):
        return self.name


class ChemicalUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    substance = models.ForeignKey(
        "Substance", on_delete=models.CASCADE, null=True, blank=True
    )
    blend = models.ForeignKey("Blend", on_delete=models.CASCADE, null=True, blank=True)
