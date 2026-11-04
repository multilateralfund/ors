from django.db import migrations

NEW_SECTION = {
    "code": "SEC2",
    "name": "SUMMARY OF KEY DATA",
    "sort_order": 15.0,
}

# name: (old code, new code)
# Matched by name, as the codes are shifted and are not unique.
SECTION_CODES = {
    "PROJECT RESULTS": ("SEC2", "SEC3"),
    "CAUSES OF DELAY": ("SEC3", "SEC4"),
    "LESSONS LEARNED": ("SEC4", "SEC5"),
    "GENDER MAINSTREAMING": ("SEC5", "SEC6"),
    "SDGS": ("SEC6", "SEC7"),
}


def _update_codes(apps, use_new_codes):
    PCRSupportingEvidenceSection = apps.get_model(
        "core", "PCRSupportingEvidenceSection"
    )
    for name, (old_code, new_code) in SECTION_CODES.items():
        PCRSupportingEvidenceSection.objects.filter(name=name).update(
            code=new_code if use_new_codes else old_code
        )


def add_summary_of_key_data_section(apps, schema_editor):
    PCRSupportingEvidenceSection = apps.get_model(
        "core", "PCRSupportingEvidenceSection"
    )
    _update_codes(apps, use_new_codes=True)
    PCRSupportingEvidenceSection.objects.update_or_create(
        name=NEW_SECTION["name"],
        defaults={
            "code": NEW_SECTION["code"],
            "sort_order": NEW_SECTION["sort_order"],
        },
    )


def remove_summary_of_key_data_section(apps, schema_editor):
    PCRSupportingEvidenceSection = apps.get_model(
        "core", "PCRSupportingEvidenceSection"
    )
    # fails if supporting evidence was already uploaded for this section
    # (on_delete=PROTECT), which is intended
    PCRSupportingEvidenceSection.objects.filter(name=NEW_SECTION["name"]).delete()
    _update_codes(apps, use_new_codes=False)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0339_pcr_supporting_evidence_section_names"),
    ]

    operations = [
        migrations.RunPython(
            add_summary_of_key_data_section, remove_summary_of_key_data_section
        ),
    ]
