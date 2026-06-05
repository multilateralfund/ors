from django.db import migrations

# Mapping: Country.name (as stored in DB) -> (name_for_apr, abbr_for_apr)
# Only Region-type entries are targeted; all others are left untouched.
APR_REGION_MAPPING = {
    "Region: Anglophone Africa": ("Africa", "AFR"),
    "Region: Fracophone Africa": ("Africa", "AFR"),
    "Region: Francophone Africa": ("Africa", "AFR"),
    "Region: Asia and the Pacific": ("Asia and the Pacific", "ASP"),
    "Region: Europe and Central Asia": ("Europe", "EUR"),
    "Global": ("Global", "GLO"),
    "Region: Latin America and the Caribbean": (
        "Latin America and the Caribbean",
        "LAC",
    ),
    "Region: South Latin America": ("Latin America and the Caribbean", "LAC"),
    "Region: South Asia": ("Asia and the Pacific", "ASP"),
    "Region: Southeast Asia": ("Asia and the Pacific", "ASP"),
    "Region: Pacific Island Countries": ("Asia and the Pacific", "ASP"),
    "Region: West Asia": ("Asia and the Pacific", "ASP"),
}


def populate_apr_fields(apps, schema_editor):
    Country = apps.get_model("core", "Country")
    for name, (name_for_apr, abbr_for_apr) in APR_REGION_MAPPING.items():
        Country.objects.filter(name=name, location_type="Region").update(
            name_for_apr=name_for_apr,
            abbr_for_apr=abbr_for_apr,
        )


def reverse_apr_fields(apps, schema_editor):
    Country = apps.get_model("core", "Country")
    Country.objects.filter(location_type="Region").update(
        name_for_apr=None,
        abbr_for_apr=None,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0298_country_abbr_for_apr_country_name_for_apr"),
    ]

    operations = [
        migrations.RunPython(populate_apr_fields, reverse_code=reverse_apr_fields),
    ]
