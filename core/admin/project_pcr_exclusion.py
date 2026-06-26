from django import forms
from django.contrib import admin

from core.models.project_pcr_exclusion import ProjectPCRRequiredExclusionRule


class ProjectPCRRequiredExclusionRuleAdminForm(forms.ModelForm):
    class Meta:
        model = ProjectPCRRequiredExclusionRule
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        types = cleaned_data.get("types")
        clusters = cleaned_data.get("clusters")
        sectors = cleaned_data.get("sectors")

        if not any([types, clusters, sectors]):
            raise forms.ValidationError("Select at least one type, cluster, or sector.")

        self._validate_duplicate_rule(types, clusters, sectors)
        return cleaned_data

    def _validate_duplicate_rule(self, types, clusters, sectors):
        type_ids = set(types.values_list("id", flat=True)) if types else set()
        cluster_ids = set(clusters.values_list("id", flat=True)) if clusters else set()
        sector_ids = set(sectors.values_list("id", flat=True)) if sectors else set()

        rules = ProjectPCRRequiredExclusionRule.objects.prefetch_related(
            "types",
            "clusters",
            "sectors",
        )
        if self.instance.pk:
            rules = rules.exclude(pk=self.instance.pk)

        for rule in rules:
            if (
                type_ids == set(rule.types.values_list("id", flat=True))
                and cluster_ids == set(rule.clusters.values_list("id", flat=True))
                and sector_ids == set(rule.sectors.values_list("id", flat=True))
            ):
                raise forms.ValidationError(
                    "A PCR required exclusion rule with the same type, cluster, "
                    "and sector selections already exists."
                )


@admin.register(ProjectPCRRequiredExclusionRule)
class ProjectPCRRequiredExclusionRuleAdmin(admin.ModelAdmin):
    form = ProjectPCRRequiredExclusionRuleAdminForm
    filter_horizontal = ["types", "clusters", "sectors"]
    list_display = [
        "name",
        "is_active",
        "types_summary",
        "clusters_summary",
        "sectors_summary",
    ]
    list_filter = ["is_active"]
    search_fields = [
        "name",
        "types__name",
        "types__code",
        "clusters__name",
        "clusters__code",
        "sectors__name",
        "sectors__code",
    ]

    def types_summary(self, obj):
        return self._summary(obj.types.all())

    types_summary.short_description = "Types"

    def clusters_summary(self, obj):
        return self._summary(obj.clusters.all())

    clusters_summary.short_description = "Clusters"

    def sectors_summary(self, obj):
        return self._summary(obj.sectors.all())

    sectors_summary.short_description = "Sectors"

    def _summary(self, values):
        labels = [
            f"{value.name} ({value.code})" if value.code else value.name
            for value in values
        ]
        return ", ".join(labels) if labels else "Any"
