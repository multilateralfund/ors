import json
import logging

from django.db import transaction
from core.import_data.utils import IMPORT_RESOURCES_DIR

from core.models import Blend, BlendComponents, Group, Substance, BlendAltName
from core.models.substance import SubstanceAltName

logger = logging.getLogger(__name__)

SUBSTACES_W_NOTE = [
    "HFC-41",
    "HFC-134",
    "HFC-143",
    "HFC-152",
]

SUBSTANCE_NOTE = (
    "These substances are not commonly used; please check "
    "the substance is used while reporting."
)

CUSTOM_SUBS_GROUP_MAPPING = {
    "HFC-245fa in imported pre-blended polyol": "Other",
    "HFC-365mfc in imported pre-blended polyol": "Other",
}


def create_other_groups():
    group_data_list = [{
        "group_id": "uncontrolled",
        "annex": "unknown",
        "name": "Other",
        "name_alt": "Other",
        "description": "Substances not controlled under the Montreal Protocol.",
        "description_alt": "",
        "is_odp": False,
        "is_gwp": False,
        "ozone_id": None,
    }, {
        "group_id": "legacy",
        "annex": "unknown",
        "name": "Legacy",
        "name_alt": "Other - Legacy",
        "description": "Substances that are not in the ozone datababse.",
        "description_alt": "",
        "is_odp": False,
        "is_gwp": False,
        "ozone_id": None,
    }]
    for group_data in group_data_list:
        group, _ = Group.objects.update_or_create(
            name=group_data["name"], defaults=group_data
        )
    return group.id


def get_uncontrolled_group_id():
    try:
        return Group.objects.get(group_id="uncontrolled").id
    except Group.DoesNotExist:
        create_other_groups()
        return Group.objects.get(group_id="uncontrolled").id

def get_legacy_group_id():
    try:
        return Group.objects.get(group_id="legacy").id
    except Group.DoesNotExist:
        create_other_groups()
        return Group.objects.get(group_id="legacy").id


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
                logger.warning(f"⚠️ blend with ozone_id {blend_ozone_id} does not exist")
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
    create_other_groups()
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


def set_substance_cp_notes():
    """
    Set substance cp notes
    """
    Substance.objects.filter(name__in=SUBSTACES_W_NOTE).update(
        cp_report_note=SUBSTANCE_NOTE
    )


def set_new_group_for_substances():
    """
    Set new group for substances
    """
    for name, group in CUSTOM_SUBS_GROUP_MAPPING.items():
        group = Group.objects.get(name=group)
        Substance.objects.filter(name=name).update(group_id=group.id)

def import_legacy_substances():
    file_path = IMPORT_RESOURCES_DIR / "legacy_substances.json"

    with open(file_path, "r", encoding="utf8") as f:
        substance_list = json.load(f)

    last_sort_order = Substance.objects.order_by("-sort_order").first().sort_order
    legacy_group_id = get_legacy_group_id()
    for subst_data in substance_list:
        # check if it is a new substance
        if Substance.objects.find_by_name(subst_data["name"]):
            logger.warning(f"Substance {subst_data['name']} already exists")
            continue

        # get group
        subst_data["group_id"] = legacy_group_id
        # set sort order
        last_sort_order += 100
        subst_data["sort_order"] = last_sort_order

        # create substance
        Substance.objects.create(**subst_data)

        # check if the substance is contained in pre-blended polyol
        if subst_data["is_contained_in_polyols"]:
            subst_data["name"] += " in imported pre-blended polyol"
            subst_data["sort_order"] += 1
            Substance.objects.create(**subst_data)

    # create Cyclopentane in Imported Pre-blended Polyol
    cyclopentane = Substance.objects.find_by_name("Cyclopentane")
    if cyclopentane:
        # check if already exists
        subst_data = {
            "name": "Cyclopentane in imported pre-blended polyol",
            "sort_order": cyclopentane.sort_order + 1,
            "group_id": legacy_group_id,
            "cp_report_note": cyclopentane.cp_report_note,
            "is_contained_in_polyols": True,
            "formula": cyclopentane.formula,
            "gwp": cyclopentane.gwp,
            "max_odp": cyclopentane.max_odp,
            "min_odp": cyclopentane.min_odp,

        }
        Substance.objects.get_or_create(name=subst_data["name"], defaults=subst_data)

    logger.info("✔ legacy substances imported")


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
    set_substance_cp_notes()
    set_new_group_for_substances()
    import_legacy_substances()

    logger.info("✔ substances imported")
    import_alternative_names(
        Substance,
        SubstanceAltName,
        "blend_component_mappings.json",
        "substance",
        ["party_blend_component"],
    )
    logger.info("✔ substances alternative names imported")

def add_components_to_blend(blend, components):
    if not components:
        return
    for comp in components:
        substance = Substance.objects.find_by_name(comp["name"])
        if not substance:
            logger.error(f"Substance {comp['name']} not found for blend {blend.name}")
            continue
        BlendComponents.objects.create(
            blend=blend, substance=substance, percentage=float(comp["percentage"])/100
        )

def get_next_legacy_mix_name():
    legacy_number = Blend.objects.filter(name__startswith="Legacy").count() + 1
    return f"LegacyMix-{legacy_number}"

def import_legacy_blends():
    file_path = IMPORT_RESOURCES_DIR / "legacy_blends.json"

    with open(file_path, "r", encoding="utf8") as f:
        blend_list = json.load(f)

    last_sort_order = (
            Blend.objects
            .filter(sort_order__isnull=False)
            .order_by("-sort_order")
            .first()
        ).sort_order

    for blend_data in blend_list:
        # check if it is a new blend
        if blend_data["name"] and Blend.objects.find_by_name(blend_data["name"]):
            logger.warning(f"Blend {blend_data['name']} already exists")
            continue
        # try to find by components
        blend_components = blend_data.pop("components")
        if blend_components:
            components = [(comp["name"], comp["percentage"]) for comp in blend_components]
            if Blend.objects.find_by_components(components):
                logger.warning(f"Blend {blend_data['name']} - "
                               f"{blend_components} already exists")
                continue

        # create blend
        blend_data["sort_order"] = last_sort_order + 100
        last_sort_order = blend_data["sort_order"]
        blend_data["is_legacy"] = True

        if not blend_data["name"]:
            blend_data["name"] = get_next_legacy_mix_name()
        blend = Blend.objects.create(**blend_data)
        add_components_to_blend(blend, blend_components)

    logger.info("✔ legacy blends imported")

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

    import_legacy_blends()


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
