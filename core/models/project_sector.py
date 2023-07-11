from django.db import models


class ProjectSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


class ProjectSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name


class ProjectSubSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sector = models.ForeignKey(ProjectSector, on_delete=models.CASCADE)

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name
