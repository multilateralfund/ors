from rest_framework import views
from rest_framework.response import Response

from core.models.user import User


class UserPermissionsView(views.APIView):
    """
    API endpoint that gives the user's permissions list
    """

    def get(self, *args, **kwargs):
        permissions = []
        if self.request.user.user_type in [
            User.UserType.VIEWER,
            User.UserType.SECRETARIAT_VIEWER,
        ]:
            permissions = [
                "view_project",
            ]

        if self.request.user.user_type in [
            User.UserType.AGENCY_SUBMITTER,
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
        ]:
            permissions = [
                "add_project",
                "edit_project",
                "increase_project_version",
                "submit_project",
                "view_project",
            ]

        if self.request.user.user_type in [
            User.UserType.AGENCY_INPUTTER,
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
        ]:
            permissions = [
                "add_project",
                "edit_project",
                "view_project",
            ]

        if self.request.user.is_superuser:
            permissions = [
                "add_project",
                "edit_project",
                "increase_project_version",
                "submit_project",
                "view_project",
            ]

        return Response(permissions)
