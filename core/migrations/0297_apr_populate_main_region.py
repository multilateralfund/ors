"""
Data migration: populate AnnualProjectReport.main_region by walking the
Country hierarchy to the root (Region), then remapping non-canonical regions
via abbreviation (WAS→ASP, ECA→EUR).
"""

from django.db import migrations


# Non-canonical region abbr → canonical APR region abbr
REGION_ABBR_REMAP = {
    "WAS": "ASP",  # West Asia → Asia and the Pacific
    "ECA": "EUR",  # Europe and Central Asia → Europe
}

REGION_TYPE = "Region"


def resolve_main_region(country, region_cache):
    """Walk the Country hierarchy to the root, then apply remap."""
    if country is None:
        return None

    # Walk up to the root (parent is None)
    node = country
    while node.parent is not None:
        node = node.parent
    region = node

    # Remap non-canonical regions
    target_abbr = REGION_ABBR_REMAP.get(region.abbr)
    if target_abbr is not None:
        region = region_cache.get(target_abbr)

    return region


def populate_main_region(apps, schema_editor):
    AnnualProjectReport = apps.get_model("core", "AnnualProjectReport")
    Country = apps.get_model("core", "Country")

    # Cache all canonical region objects keyed by abbr
    region_cache = {
        c.abbr: c for c in Country.objects.filter(location_type=REGION_TYPE)
    }

    aprs = list(
        AnnualProjectReport.objects.select_related(
            "project__country__parent__parent"
        ).all()
    )

    to_update = []
    for apr in aprs:
        if not (apr.project and apr.project.country):
            continue
        region = resolve_main_region(apr.project.country, region_cache)
        apr.main_region_id = region.pk if region else None
        to_update.append(apr)

    AnnualProjectReport.objects.bulk_update(to_update, ["main_region"], batch_size=500)


def reverse_populate_main_region(apps, schema_editor):
    AnnualProjectReport = apps.get_model("core", "AnnualProjectReport")
    AnnualProjectReport.objects.update(main_region=None)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0296_annualprojectreport_main_region"),
    ]

    operations = [
        migrations.RunPython(
            populate_main_region,
            reverse_code=reverse_populate_main_region,
        ),
    ]
