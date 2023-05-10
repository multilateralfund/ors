import json
import logging

from django.db import transaction
from django.conf import settings

from core.models import Blend, BlendComponents, Group, Substance
from core.models.substance import SubstanceAltName

logger = logging.getLogger(__name__)


@transaction.atomic
def import_data(cls, file_path, exclude=[]):
    with open(file_path, "r") as f:
        list_data = json.load(f)

    for instance_data in list_data:
        instance = instance_data["fields"]
        instance["ozone_id"] = instance_data["pk"]
        # remove unused fields
        for k in exclude:
            instance.pop(k)

        # set custom fields
        if cls == Group and instance["annex"]:
            # set annex => 1->A; 2->B; 3->C
            instance["annex"] = chr(ord("A") + instance["annex"] - 1)
        elif cls == Blend:
            # set blend name
            instance["name"] = instance.pop("blend_id")
        elif cls == Substance and instance["group"]:
            # set foreign key
            group_ozone_id = instance.pop("group")
            instance["group_id"] = Group.objects.get(ozone_id=group_ozone_id).id
        elif cls == BlendComponents:
            # set foreign key
            blend_ozone_id = instance.pop("blend")
            substance_ozone_id = instance.pop("substance")
            instance["blend_id"] = Blend.objects.get(ozone_id=blend_ozone_id).id
            instance["substance_id"] = Substance.objects.get(
                ozone_id=substance_ozone_id
            ).id

        # create or update instance
        if cls == BlendComponents:
            cls.objects.update_or_create(
                blend_id=instance["blend_id"],
                substance_id=instance["substance_id"],
                defaults=instance,
            )
        else:
            cls.objects.update_or_create(
                name=instance["name"],
                defaults=instance,
            )


def import_groups():
    exclude = [
        "control_treaty",
        "report_treaty",
        "phase_out_year_article_5",
        "phase_out_year_non_article_5",
    ]
    import_data(Group, settings.IMPORT_RESOURCES_DIR / "groups.json", exclude)
    logger.info("✔ groups imported")


def import_substances_alternative_names():
    """
    Import substances alternative names from json file
    """

    # read data from json file
    file_name = settings.IMPORT_RESOURCES_DIR / "blend_component_mappings.json"
    with open(file_name, "r") as f:
        list_data = json.load(f)

    # create or update instance for alternative names
    for instance_data in list_data:
        # get instance data
        instance = {
            "name": instance_data["fields"]["party_blend_component"],
            "ozone_id": instance_data["pk"],
        }
        instance["substance_id"] = Substance.objects.get(
            ozone_id=instance_data["fields"]["substance"]
        ).id

        # create or update substance name
        SubstanceAltName.objects.update_or_create(
            name=instance["name"],
            defaults=instance,
        )


def import_substances():
    """
    Import substances from json file and create alternative names
    """
    exclude = [
        "substance_id",
        "gwp2",
        "remark",
        "r_code",
        "main_usage",
        "has_critical_uses",
    ]
    import_data(Substance, settings.IMPORT_RESOURCES_DIR / "substances.json", exclude)
    logger.info("✔ substances imported")
    import_substances_alternative_names()
    logger.info("✔ substances alternative names imported")


def import_blends():
    exclude = [
        "legacy_blend_id",
        "party",
        "hfc",
        "hcfc",
        "main_usage",
        "remark",
        "cnumber",
        "is_deactivated",
    ]

    import_data(Blend, settings.IMPORT_RESOURCES_DIR / "blends.json", exclude)
    logger.info("✔ blends imported")


def import_blend_components():
    exclude = ["cnumber"]
    import_data(
        BlendComponents,
        settings.IMPORT_RESOURCES_DIR / "blend_components.json",
        exclude,
    )
    logger.info("✔ blend components imported")


def import_all_data():
    import_groups()
    import_substances()
    import_blends()
    import_blend_components()
