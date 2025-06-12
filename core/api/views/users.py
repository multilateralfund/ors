from rest_framework import views
from rest_framework.response import Response

from core.models.user import User


class UserPermissionsView(views.APIView):
    """
    API endpoint that gives the user's permissions list
    """

    def get(self, *args, **kwargs):
        permissions = []
        if self.request.user.user_type in [User.UserType.BP_EDITOR]:
            permissions = [
                "export_bp_activity",
                "upload_bp_file",
                "delete_bp_file",
                "retrieve_bp_file",
                "download_bp_file",
                "view_business_plan",
                "view_business_plan_get_years",
                "upload-validate_business_plan",
                "upload_business_plan",
                "update_business_plan",
                "view_business_plan_activity",
            ]
        if self.request.user.user_type in [
            User.UserType.BP_VIEWER,
        ]:
            permissions = [
                "export_bp_activity",
                "retrieve_bp_file",
                "download_bp_file",
                "view_business_plan",
                "view_business_plan_get_years",
                "view_business_plan_activity",
            ]
        if self.request.user.user_type in [
            User.UserType.VIEWER,
            User.UserType.SECRETARIAT_VIEWER,
        ]:
            permissions = [
                "view_project",
            ]

        if self.request.user.user_type in [
            User.UserType.AGENCY_SUBMITTER,
        ]:
            permissions = [
                "add_project",
                "edit_project",
                "increase_project_version",
                "submit_project",
                "view_project",
            ]

        if self.request.user.user_type in [
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
        ]:
            permissions = [
                "add_project",
                "edit_project",
                "increase_project_version",
                "send_project_back_to_draft",
                "submit_project",
                "view_project",
                "withdraw_project",
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
                "export_bp_activity",
                "upload_bp_file",
                "delete_bp_file",
                "retrieve_bp_file",
                "download_bp_file",
                "view_business_plan",
                "view_business_plan_get_years",
                "upload-validate_business_plan",
                "upload_business_plan",
                "update_business_plan",
                "view_business_plan_activity",
            ]

        return Response(permissions)
