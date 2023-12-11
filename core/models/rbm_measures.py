from django.db import models


class RBMMeasure(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    sort_order = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "RBM Measure"
        verbose_name_plural = "RBM Measures"

    def __str__(self):
        return self.name
