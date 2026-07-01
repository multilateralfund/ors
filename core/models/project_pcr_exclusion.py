from django.db import models
from django.db.models import Q

from core.models.project_metadata import ProjectCluster, ProjectSector, ProjectType


class ProjectPCRRequiredExclusionRuleManager(models.Manager):
    def active_project_q(self) -> Q:
        """
        Build a Project queryset predicate for active PCR required exclusion rules.
        Empty rule dimensions are wildcards.
        """
        project_q = Q(pk__in=[])
        rules = self.filter(is_active=True).prefetch_related(
            "types",
            "clusters",
            "sectors",
        )

        for rule in rules:
            rule_q = Q()

            type_ids = list(rule.types.values_list("id", flat=True))
            if type_ids:
                rule_q &= Q(project_type_id__in=type_ids)

            cluster_ids = list(rule.clusters.values_list("id", flat=True))
            if cluster_ids:
                rule_q &= Q(cluster_id__in=cluster_ids)

            sector_ids = list(rule.sectors.values_list("id", flat=True))
            if sector_ids:
                rule_q &= Q(sector_id__in=sector_ids)

            if rule_q:
                project_q |= rule_q

        return project_q


class ProjectPCRRequiredExclusionRule(models.Model):
    name = models.CharField(max_length=255, unique=True)
    types = models.ManyToManyField(ProjectType, blank=True, related_name="+")
    clusters = models.ManyToManyField(ProjectCluster, blank=True, related_name="+")
    sectors = models.ManyToManyField(ProjectSector, blank=True, related_name="+")
    is_active = models.BooleanField(default=True)

    objects = ProjectPCRRequiredExclusionRuleManager()

    class Meta:
        verbose_name = "Project PCR required exclusion rule"
        verbose_name_plural = "Project PCR required exclusion rules"
        ordering = ("name",)

    def __str__(self):
        return self.name
