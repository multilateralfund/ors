import json
import logging

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.core.management import BaseCommand

from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
)

logger = logging.getLogger(__name__)


def import_permissions(file_path):
    with open(file_path, "r", encoding="utf8") as f:
        permissions_json = json.load(f)
    for permission in permissions_json:
        codename = permission.get("permission_codename")
        name = permission.get("permission_name")
        app_label = permission.get("app_label")
        model_name = permission.get("model_name")

        try:
            content_type = ContentType.objects.get(
                app_label=app_label, model=model_name
            )
        except ContentType.DoesNotExist:
            logger.error(
                f"Content type with app_label '{app_label}' and model '{model_name}' does not exist."
            )
            continue
        Permission.objects.update_or_create(
            codename=codename,
            content_type=content_type,
            defaults={"name": name},
        )


def import_user_groups(file_path):
    with open(file_path, "r", encoding="utf8") as f:
        user_groups_json = json.load(f)
    for group in user_groups_json:
        group_name = group.get("name")
        permissions = group.get("permissions", [])

        # Create or update the group
        group_obj, created = Group.objects.get_or_create(name=group_name)

        # Clear existing permissions
        if not created:
            group_obj.permissions.clear()

        # Add permissions to the group
        for perm in permissions:
            try:
                permission = Permission.objects.get(codename=perm)
            except Permission.DoesNotExist:
                logger.error(f"Permission with codename '{perm}' does not exist.")
                continue
            group_obj.permissions.add(permission)

        group_obj.save()


class Command(BaseCommand):
    help = """
        Import user permissions and groups
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "actions",
            type=str,
            help="Actions to perform",
            default="all",
            choices=[
                "all",
                "clean_up_permissions",
                "import_permissions",
                "import_user_groups",
            ],
        )

    def handle(self, *args, **kwargs):

        actions = kwargs.get("actions", "all")
        if actions in ["all", "clean_up_permissions"]:
            logger.info("Cleaning up permissions...")
            Permission.objects.all().delete()
            logger.info("✔ permissions cleaned up")

        if actions in ["all", "import_permissions"]:
            file_path = IMPORT_RESOURCES_DIR / "users" / "permissions.json"
            import_permissions(file_path)
            logger.info("✔ permissions imported")

        if actions in ["all", "import_user_groups"]:
            file_path = IMPORT_RESOURCES_DIR / "users" / "groups.json"
            import_user_groups(file_path)
            logger.info("✔ user groups imported")
