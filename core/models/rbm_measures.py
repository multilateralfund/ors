from django.db import models


class RBMMeasure(models.Model):
    """
    Results-Based Management Measure model
    Measures that are used to track the performance of the project
    """

    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    sort_order = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "RBM Measure"
        verbose_name_plural = "RBM Measures"

    def __str__(self):
        return self.name
