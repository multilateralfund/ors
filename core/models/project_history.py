from django.conf import settings

from django.db import models


class ProjectHistory(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Creation date",
    )

    project = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="project_history",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="updated_projects",
        help_text="User who updated the project",
    )

    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Project history"
        ordering = ["-created_at"]
