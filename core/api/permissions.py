from rest_framework import permissions


class IsUserAllowedCP(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if (
                user.user_type == user.UserType.COUNTRY_USER
                or user.user_type == user.UserType.SECRETARIAT
            ):
                return True

            if (
                user.user_type == user.UserType.AGENCY
                or user.user_type == user.UserType.STAKEHOLDER
            ):
                if request.method in permissions.SAFE_METHODS:
                    return True
        return False
