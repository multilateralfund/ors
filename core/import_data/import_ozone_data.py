import json
import logging

from django.db import transaction
from core.import_data.utils import IMPORT_RESOURCES_DIR

from core.models import Blend, BlendComponents, Group, Substance, BlendAltName
from core.models.substance import SubstanceAltName

logger = logging.getLogger(__name__)


def create_uncontrolled_group():
    group_data = {
        "group_id": "uncontrolled",
        "annex": "unknown",
        "name": "Other",
        "name_alt": "Alternatives",
        "description": "Substances not controlled under the Montreal Protocol.",
        "description_alt": "",
        "is_odp": False,
        "is_gwp": False,
        "ozone_id": None,
    }
    group, _ = Group.objects.update_or_create(
        name=group_data["name"], defaults=group_data
    )
    return group.id


def get_uncontrolled_group_id():
    try:
        return Group.objects.get(group_id="uncontrolled").id
    except Group.DoesNotExist:
        return create_uncontrolled_group()


@transaction.atomic
def import_data(cls, file_path, exclude=None, uncontrolled_group_id=None):
    if exclude is None:
        exclude = []

    with open(file_path, "r", encoding="utf8") as f:
        list_data = json.load(f)

    for instance_data in list_data:
        instance = instance_data["fields"]
        instance["ozone_id"] = instance_data["pk"]
        # remove unused fields
        for k in exclude:
            instance.pop(k)

        # set custom fields
        if cls == Group:
            # the annex is the first letter of the name
            instance["annex"] = instance["name"][0]
        elif cls == Blend:
            # skip deactivated blends
            if instance["is_deactivated"]:
                continue
            instance.pop("is_deactivated")
            # set blend name
            instance["name"] = instance.pop("blend_id")
        elif cls == Substance:
            if instance["group"]:
                group_ozone_id = instance.pop("group")
                instance["group_id"] = Group.objects.get(ozone_id=group_ozone_id).id
            else:
                instance["group_id"] = uncontrolled_group_id
        elif cls == BlendComponents:
            # set foreign key
            blend_ozone_id = instance.pop("blend")
            substance_ozone_id = instance.pop("substance")
            try:
                instance["blend_id"] = Blend.objects.get(ozone_id=blend_ozone_id).id
                instance["substance_id"] = Substance.objects.get(
                    ozone_id=substance_ozone_id
                ).id
            except Blend.DoesNotExist:
                logger.warning(
                    f"⚠️ blend with ozone_id {blend_ozone_id} does not exist"
                )
                continue
            except Substance.DoesNotExist:
                logger.warning(
                    f"⚠️ substance with ozone_id {substance_ozone_id} does not exist"
                )
                continue

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
            # if the chemical is contained in pre-blended polyol, we need to create a new chemical
            if cls in [Substance, Blend] and instance["is_contained_in_polyols"]:
                instance["name"] += " in imported pre-blended polyol"
                instance["sort_order"] += 1
                instance.pop("ozone_id")
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
    import_data(Group, IMPORT_RESOURCES_DIR / "groups.json", exclude)
    # create a group for substances that don't have a group
    create_uncontrolled_group()
    logger.info("✔ groups imported")


def import_alternative_names(
    cls, cls_alt_name, file_name, chemical_name, field_names, skip_cond=None
):
    """
    Import alternative names from json file
    @param cls class
    @param file_name string
    @param chemical_name string (substance or blend)
    @param field_name string (field from json for alternative name)
    @param skip_cond function (optional)
    """

    # read data from json file
    file_name = IMPORT_RESOURCES_DIR / file_name
    with open(file_name, "r", encoding="utf8") as f:
        list_data = json.load(f)

    # create or update instance for alternative names
    for instance_data in list_data:
        # get instance data
        for field_name in field_names:
            if skip_cond and skip_cond(instance_data["fields"][field_name]):
                continue
            instance = {
                "name": instance_data["fields"][field_name],
                "ozone_id": instance_data["pk"],
            }
            try:
                instance[f"{chemical_name}_id"] = cls.objects.get(
                    ozone_id=instance_data["fields"][chemical_name]
                ).id
            except cls.DoesNotExist:
                logger.warning(
                    f"⚠️ {chemical_name} with ozone_id {instance_data['fields'][chemical_name]} does not exist"
                )
                continue

            # create or update name
            cls_alt_name.objects.update_or_create(
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
    uncontrolled_group_id = get_uncontrolled_group_id()
    import_data(
        Substance,
        IMPORT_RESOURCES_DIR / "substances.json",
        exclude,
        uncontrolled_group_id,
    )
    logger.info("✔ substances imported")
    import_alternative_names(
        Substance,
        SubstanceAltName,
        "blend_component_mappings.json",
        "substance",
        ["party_blend_component"],
    )
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
    ]

    import_data(Blend, IMPORT_RESOURCES_DIR / "blends.json", exclude)
    logger.info("✔ blends imported")
    import_alternative_names(
        Blend,
        BlendAltName,
        "blend_mappings.json",
        "blend",
        ["party_blend_id", "remarks"],
        lambda value: value == "Found in MLFS data" or value.isnumeric(),
    )
    logger.info("✔ blends alternative names imported")


def import_blend_components():
    exclude = ["cnumber"]
    import_data(
        BlendComponents,
        IMPORT_RESOURCES_DIR / "blend_components.json",
        exclude,
    )
    logger.info("✔ blend components imported")


def import_all_data():
    import_groups()
    import_substances()
    import_blends()
    import_blend_components()
