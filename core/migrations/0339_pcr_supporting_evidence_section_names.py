from django.db import migrations

# code: (old name, new name)
SECTION_NAMES = {
    "SEC1": ("Section 1: PROJECT OVERVIEW", "OVERVIEW"),
    "SEC2": (
        "Section 2: PROJECT RESULTS: OVERALL ASSESSMENT HIGHLIGHTS",
        "PROJECT RESULTS",
    ),
    "SEC3": ("Section 3: CAUSES OF DELAYS AND ACTION TAKEN", "CAUSES OF DELAY"),
    "SEC4": ("Section 4: LESSONS LEARNED", "LESSONS LEARNED"),
    "SEC5": ("Section 5: GENDER MAINSTREAMING", "GENDER MAINSTREAMING"),
    "SEC6": (
        "Section 6: CONTRIBUTION TO THE SUSTAINABLE DEVELOPMENT GOALS (SDGs) (Optional).",
        "SDGS",
    ),
    "SEC8": ("Section 8: OTHER SUPPORTING EVIDENCE", "OTHER SUPPORTING EVIDENCE"),
}


def _rename_sections(apps, use_new_names):
    PCRSupportingEvidenceSection = apps.get_model(
        "core", "PCRSupportingEvidenceSection"
    )
    for code, (old_name, new_name) in SECTION_NAMES.items():
        PCRSupportingEvidenceSection.objects.filter(code=code).update(
            name=new_name if use_new_names else old_name
        )


def rename_sections(apps, schema_editor):
    _rename_sections(apps, use_new_names=True)


def restore_section_names(apps, schema_editor):
    _rename_sections(apps, use_new_names=False)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0338_merge_20261029_1509"),
    ]

    operations = [
        migrations.RunPython(rename_sections, restore_section_names),
    ]
