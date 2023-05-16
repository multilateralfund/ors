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
    description = models.TextField(null=True, blank=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)

    objects = UsageManager()

    def __str__(self):
        return self.name
