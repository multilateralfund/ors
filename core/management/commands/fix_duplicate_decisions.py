from operator import attrgetter
from collections import defaultdict
from core.models.meeting import Decision
from django.db import router
from django.db.models import Count
from django.db.models.deletion import Collector
from django.contrib.postgres.aggregates import ArrayAgg
from pprint import pprint

from django.core.management import BaseCommand


def check_side_effects(want_to_delete):
    collector = Collector(using=router.db_for_write(Decision))
    collector.collect(want_to_delete)

    other_deletes = defaultdict(list)
    for model, objects in collector.data.items():
        if model is not Decision and objects:
            other_deletes[model._meta.label].extend([x.pk for x in objects])

    for queryset in collector.fast_deletes:
        if queryset.model is not Decision and queryset.exists():
            other_deletes[queryset.model._meta.label].extend([x.pk for x in queryset])

    return dict(other_deletes)


def fix_decisions(dry_run=False):
    if dry_run:
        print("Dry run requested, nothing will be changed!")

    dups = (
        Decision.objects.values("meeting_id", "number")
        .annotate(
            count=Count("id"),
            ids=ArrayAgg("id"),
            internal_api_id_count=Count("internal_api_id", distinct=True),
        )
        .filter(
            count__gt=1,
            internal_api_id_count__gt=1,
        )
    )

    duplicates = [
        [Decision.objects.get(id=j) for j in i] for i in [x["ids"] for x in dups]
    ]

    print(len(duplicates))

    to_delete = []
    check_usages = {}

    for d in duplicates:
        stale, latest = sorted(d, key=attrgetter("pk"))
        assert stale.api_changed <= latest.api_changed

        has_side_effects = check_side_effects([latest])
        if has_side_effects:
            check_usages[latest.pk] = has_side_effects
            print(f"Usages of {latest.pk} need to be replaced with {stale.pk}")
        else:
            latest_internal_api_id = latest.internal_api_id

            print(
                f"Updating {stale.pk} internal id: {stale.internal_api_id} => {latest_internal_api_id}."
            )

            if not dry_run:
                # need to clear to avoid constraint violation
                Decision.objects.filter(pk=latest.pk).update(internal_api_id=None)

                Decision.objects.filter(pk=stale.pk).update(
                    title=latest.title,
                    number=latest.number,
                    pseudo_content_preview=latest.pseudo_content_preview,
                    internal_api_id=latest_internal_api_id,
                    text=latest.text,
                    api_changed=latest.api_changed,
                )

            to_delete.append(latest.id)

    if not dry_run:
        candidates = Decision.objects.filter(id__in=to_delete)
        candidates.delete()
        print(f"Deleted {len(to_delete)} decisions!")
    else:
        print(f"Skipped delete of {len(to_delete)} decisions!")

    print("CHECK USAGES:")
    pprint(check_usages)


class Command(BaseCommand):
    help = """
        Script to merge upstream duplicate decisions.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the migration without saving any changes to the database",
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        fix_decisions(dry_run)
