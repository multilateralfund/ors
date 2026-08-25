"""
The script will output what other model instances will be deleted by deleting the target model instance.

Edit to_delete and run via python manage.py shell < ./scripts/check_safe_to_delete.py
"""

from collections import defaultdict

from django.db import router
from django.db.models.deletion import Collector

from core.models import ProjectOdsOdp


def check_side_effects(want_to_delete, target_model):
    collector = Collector(using=router.db_for_write(target_model))
    collector.collect(want_to_delete)

    other_deletes = defaultdict(list)
    for model, objects in collector.data.items():
        if model is not target_model and objects:
            other_deletes[model._meta.label].extend([x.pk for x in objects])

    for queryset in collector.fast_deletes:
        print(queryset)
        if queryset.model is not target_model and queryset.exists():
            other_deletes[queryset.model._meta.label].extend([x.pk for x in queryset])

    return dict(other_deletes)


to_delete = [ProjectOdsOdp.objects.get(id=27744)]

print(check_side_effects(to_delete, ProjectOdsOdp))
