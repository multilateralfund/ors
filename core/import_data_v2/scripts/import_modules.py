from django.db import transaction

from core.models.base import Module


@transaction.atomic
def import_modules():
    """
    Import modules
    """
    modules = [
        {"name": "Projects", "code": "Projects"},
        {"name": "Business Plans", "code": "BP"},
        {"name": "Country Programmes", "code": "CP"},
    ]

    for module_data in modules:
        Module.objects.update_or_create(
            code=module_data["code"], defaults={"name": module_data["name"]}
        )
