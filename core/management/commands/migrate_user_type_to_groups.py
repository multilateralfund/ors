from django.core.management import BaseCommand

from django.contrib.auth.models import Group

from core.models import User

from core.import_data.import_project_resources_v2 import import_project_resources_v2


class Command(BaseCommand):
    help = """
        Migrate user types to groups
    """

    def _add_group_to_users(self, group_name, user_type):
        """
        Add a group to users with a specific user type.
        """
        group = Group.objects.get(name=group_name)
        users = User.objects.filter(user_type=user_type)
        for user in users:
            user.groups.add(group)
            user.save()

    def handle(self, *args, **kwargs):
        self._add_group_to_users("Agency inputter", User.UserType.AGENCY_INPUTTER)
        self._add_group_to_users("Agency submitter", User.UserType.AGENCY_SUBMITTER)
        self._add_group_to_users("Country user", User.UserType.COUNTRY_USER)
        self._add_group_to_users("Country submitter", User.UserType.COUNTRY_SUBMITTER)
        self._add_group_to_users("Secretariat", User.UserType.SECRETARIAT)
        self._add_group_to_users("Business plan editor", User.UserType.SECRETARIAT)
        self._add_group_to_users("Viewer", User.UserType.VIEWER)
        self._add_group_to_users("Stakeholder", User.UserType.STAKEHOLDER)
        self._add_group_to_users("Treasurer", User.UserType.TREASURER)
        self._add_group_to_users("Country programme viewer", User.UserType.CP_VIEWER)
        self._add_group_to_users(
            "Secretariat project viewer", User.UserType.SECRETARIAT_VIEWER
        )
        self._add_group_to_users(
            "Secretariat project v1/v2 editing access",
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Secretariat project v3 editing access",
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Secretariat production project v1/v2 editing access",
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Secretariat production project v3 editing access",
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
        )
        self._add_group_to_users("Business plan viewer", User.UserType.BP_VIEWER)
        self._add_group_to_users("Business plan editor", User.UserType.BP_EDITOR)
