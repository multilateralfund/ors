import django.db.models.deletion
from django.db import migrations, models


def copy_m2m_to_through_models(apps, schema_editor):
    PCRDelayCause = apps.get_model("core", "PCRDelayCause")
    PCRDelayCauseRootCause = apps.get_model("core", "PCRDelayCauseRootCause")
    PCRLearnedLesson = apps.get_model("core", "PCRLearnedLesson")
    PCRLearnedLessonDescription = apps.get_model("core", "PCRLearnedLessonDescription")

    # The texts were previously shared by all entries, so copy them on each entry
    PCRDelayCauseRootCause.objects.bulk_create(
        PCRDelayCauseRootCause(
            delay_cause=delay_cause,
            root_cause=root_cause,
            description_roots_causes_of_delay=(
                delay_cause.description_roots_causes_of_delay
            ),
            action_taken=delay_cause.action_taken,
        )
        for delay_cause in PCRDelayCause.objects.prefetch_related(
            "root_causes_of_delay"
        )
        for root_cause in delay_cause.root_causes_of_delay.all()
    )
    PCRLearnedLessonDescription.objects.bulk_create(
        PCRLearnedLessonDescription(
            learned_lesson=learned_lesson,
            lesson=lesson,
            description=learned_lesson.description,
        )
        for learned_lesson in PCRLearnedLesson.objects.prefetch_related("lessons")
        for lesson in learned_lesson.lessons.all()
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0331_rename_action_token_pcrdelaycause_action_taken"),
    ]

    operations = [
        migrations.CreateModel(
            name="PCRDelayCauseRootCause",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "description_roots_causes_of_delay",
                    models.TextField(
                        blank=True,
                        help_text="Description of the roots causes of delay",
                        null=True,
                    ),
                ),
                (
                    "action_taken",
                    models.TextField(blank=True, help_text="Action taken", null=True),
                ),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                ("date_updated", models.DateTimeField(auto_now=True)),
                (
                    "delay_cause",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.pcrdelaycause",
                    ),
                ),
                (
                    "root_cause",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="core.pcrrootcausesofdelay",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "PCR delay cause root causes",
            },
        ),
        migrations.CreateModel(
            name="PCRLearnedLessonDescription",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        help_text="Description of the lesson learned",
                        null=True,
                    ),
                ),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                ("date_updated", models.DateTimeField(auto_now=True)),
                (
                    "learned_lesson",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.pcrlearnedlesson",
                    ),
                ),
                (
                    "lesson",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="core.pcrlearnedlessoncategory",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "PCR learned lesson descriptions",
            },
        ),
        migrations.RunPython(copy_m2m_to_through_models, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="pcrdelaycause",
            name="root_causes_of_delay",
        ),
        migrations.RemoveField(
            model_name="pcrdelaycause",
            name="description_roots_causes_of_delay",
        ),
        migrations.RemoveField(
            model_name="pcrdelaycause",
            name="action_taken",
        ),
        migrations.RemoveField(
            model_name="pcrlearnedlesson",
            name="lessons",
        ),
        migrations.RemoveField(
            model_name="pcrlearnedlesson",
            name="description",
        ),
        migrations.AddField(
            model_name="pcrdelaycause",
            name="root_causes_of_delay",
            field=models.ManyToManyField(
                related_name="delay_causes",
                through="core.PCRDelayCauseRootCause",
                to="core.pcrrootcausesofdelay",
            ),
        ),
        migrations.AddField(
            model_name="pcrlearnedlesson",
            name="lessons",
            field=models.ManyToManyField(
                related_name="lessons",
                through="core.PCRLearnedLessonDescription",
                to="core.pcrlearnedlessoncategory",
            ),
        ),
    ]
