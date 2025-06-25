from django.core.management import BaseCommand

from django.contrib.auth.models import Group

from core.models import User


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
        self._add_group_to_users(
            "Projects - Agency inputter", User.UserType.AGENCY_INPUTTER
        )
        self._add_group_to_users(
            "Projects - Agency submitter", User.UserType.AGENCY_SUBMITTER
        )
        self._add_group_to_users("CP - Viewer", User.UserType.VIEWER)
        self._add_group_to_users("CP - Viewer", User.UserType.CP_VIEWER)
        self._add_group_to_users("CP - Country user", User.UserType.COUNTRY_USER)
        self._add_group_to_users(
            "CP - Country submitter", User.UserType.COUNTRY_SUBMITTER
        )
        self._add_group_to_users("CP - Secretariat", User.UserType.SECRETARIAT)
        self._add_group_to_users("BP - Editor", User.UserType.SECRETARIAT)
        self._add_group_to_users("Replenishment - Viewer", User.UserType.STAKEHOLDER)
        self._add_group_to_users("Replenishment - Treasurer", User.UserType.TREASURER)

        self._add_group_to_users(
            "Projects - MLFS Viewer", User.UserType.SECRETARIAT_VIEWER
        )
        self._add_group_to_users(
            "Projects - MLFS Submission V1/V2",
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Projects - MLFS Submission V3",
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Projects - MLFS Submission V1/V2 Production",
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
        )
        self._add_group_to_users(
            "Projects - MLFS Submission V3 Production",
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
        )
        self._add_group_to_users("BP - Viewer", User.UserType.BP_VIEWER)
        self._add_group_to_users("BP - Editor", User.UserType.BP_EDITOR)
