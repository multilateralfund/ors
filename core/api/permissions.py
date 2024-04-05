from rest_framework import permissions


class IsUserAllowedCP(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.user_type in (
                user.UserType.COUNTRY_USER,
                user.UserType.SECRETARIAT,
            ):
                return True

            if user.user_type in (user.UserType.AGENCY, user.UserType.STAKEHOLDER):
                if request.method in permissions.SAFE_METHODS:
                    return True
        return False
