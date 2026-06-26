from django.db import migrations


RULE_NAMES = [
    "Types not PCR required",
    "Enabling activities not PCR required",
    "Verification HPMP/KIP not PCR required",
]


def get_objects_by_codes(model, codes):
    objects = list(model.objects.filter(code__in=codes))
    found_codes = {obj.code for obj in objects}
    if found_codes != set(codes):
        return None
    return objects


def create_rule(
    rule_model,
    project_type_model,
    project_cluster_model,
    project_sector_model,
    name,
    type_codes=(),
    cluster_codes=(),
    sector_codes=(),
):
    types = get_objects_by_codes(project_type_model, type_codes)
    clusters = get_objects_by_codes(project_cluster_model, cluster_codes)
    sectors = get_objects_by_codes(project_sector_model, sector_codes)

    if types is None or clusters is None or sectors is None:
        return

    rule, _ = rule_model.objects.update_or_create(
        name=name,
        defaults={"is_active": True},
    )
    rule.types.set(types)
    rule.clusters.set(clusters)
    rule.sectors.set(sectors)


def seed_project_pcr_exclusion_rules(apps, _schema_editor):
    rule_model = apps.get_model("core", "ProjectPCRRequiredExclusionRule")
    project_type_model = apps.get_model("core", "ProjectType")
    project_cluster_model = apps.get_model("core", "ProjectCluster")
    project_sector_model = apps.get_model("core", "ProjectSector")

    create_rule(
        rule_model,
        project_type_model,
        project_cluster_model,
        project_sector_model,
        "Types not PCR required",
        type_codes=("INS", "PS", "PRP"),
    )
    create_rule(
        rule_model,
        project_type_model,
        project_cluster_model,
        project_sector_model,
        "Enabling activities not PCR required",
        sector_codes=("ENA",),
    )
    create_rule(
        rule_model,
        project_type_model,
        project_cluster_model,
        project_sector_model,
        "Verification HPMP/KIP not PCR required",
        cluster_codes=("HPMP1", "HPMP2", "HPMP3", "HPMP4", "KIP1", "KIP2", "KIP3"),
        sector_codes=("VER",),
    )


def remove_project_pcr_exclusion_rules(apps, _schema_editor):
    rule_model = apps.get_model("core", "ProjectPCRRequiredExclusionRule")
    rule_model.objects.filter(name__in=RULE_NAMES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0305_project_pcr_exclusion_rule"),
    ]

    operations = [
        migrations.RunPython(
            seed_project_pcr_exclusion_rules,
            remove_project_pcr_exclusion_rules,
        ),
    ]
