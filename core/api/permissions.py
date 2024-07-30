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

            if user.user_type in (
                user.UserType.AGENCY_SUBMITTER,
                user.UserType.AGENCY_INPUTTER,
                user.UserType.STAKEHOLDER,
            ):
                if request.method in permissions.SAFE_METHODS:
                    return True
        return False


class IsUserAllowedBP(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.user_type in (
                user.UserType.AGENCY_SUBMITTER,
                user.UserType.AGENCY_INPUTTER,
                user.UserType.SECRETARIAT,
            ):
                return True

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return True

        if user.agency == obj.agency:
            return True

        return False


class IsUserAllowedBPRecord(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.user_type in (
                user.UserType.AGENCY_SUBMITTER,
                user.UserType.AGENCY_INPUTTER,
                user.UserType.SECRETARIAT,
            ):
                return True

        return False


class IsUserAllowedCPComment(IsUserAllowedCP):
    """
    Is this user allowed to POST comments on a CPReport.

    Inherits from IsUserAllowedCP as users have the same rights at has_permission-level.
    """


class IsUserSecretariatOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.is_superuser:
                return True
            if user.user_type == user.UserType.SECRETARIAT:
                return True
        return False
