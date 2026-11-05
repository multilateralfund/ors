from django.db import migrations
from django.db.models import OuterRef, Subquery

OLD_PCR_RELATED_MODELS = [
    "OLD_PCRActivity",
    "OLD_PCRDelayExplanation",
    "OLD_PCRLearnedLessons",
]


def link_old_pcr_data(apps, schema_editor):
    """
    Create an OLD_PCR (status Final) for every meta project with old PCR data and
    link the existing activities, delay explanations and learned lessons to it.
    """
    OLD_PCR = apps.get_model("core", "OLD_PCR")

    meta_project_ids = set()
    for model_name in OLD_PCR_RELATED_MODELS:
        model = apps.get_model("core", model_name)
        meta_project_ids.update(model.objects.values_list("meta_project_id", flat=True))

    OLD_PCR.objects.bulk_create(
        [OLD_PCR(meta_project_id=pk) for pk in meta_project_ids],
        batch_size=1000,
        ignore_conflicts=True,
    )

    old_pcr_subquery = OLD_PCR.objects.filter(
        meta_project_id=OuterRef("meta_project_id")
    ).values("id")[:1]
    for model_name in OLD_PCR_RELATED_MODELS:
        model = apps.get_model("core", model_name)
        model.objects.filter(old_pcr__isnull=True).update(
            old_pcr=Subquery(old_pcr_subquery)
        )


def unlink_old_pcr_data(apps, schema_editor):
    for model_name in OLD_PCR_RELATED_MODELS:
        model = apps.get_model("core", model_name)
        model.objects.update(old_pcr=None)
    apps.get_model("core", "OLD_PCR").objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0339_old_pcr"),
    ]

    operations = [
        migrations.RunPython(link_old_pcr_data, unlink_old_pcr_data),
    ]
