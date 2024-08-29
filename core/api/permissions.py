from rest_framework import permissions


class IsSecretariat(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.is_superuser:
                return True
            if user.user_type == user.UserType.SECRETARIAT:
                return True
        return False


class IsUserAllowedReplenishment(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.user_type == user.UserType.TREASURER:
                return True

            if user.user_type in (
                user.UserType.COUNTRY_USER,
                user.UserType.COUNTRY_SUBMITTER,
                user.UserType.AGENCY_INPUTTER,
                user.UserType.AGENCY_SUBMITTER,
                user.UserType.SECRETARIAT,
                user.UserType.STAKEHOLDER,
            ):
                if request.method in permissions.SAFE_METHODS:
                    return True

        return False


class IsAgency(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if "agency" in user.user_type.lower() and user.agency_id is not None:
                return True
        return False

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the object

        If the object does not have an agency_id attribute, return True.
        Else check if the user's agency_id matches the object's agency_id.

        """
        if getattr(obj, "agency_id", "no attr") == "no attr":
            return True

        if request.user.agency_id == obj.agency_id:
            return True
        return False


class IsAgencySubmitter(IsAgency):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if (
                user.user_type == user.UserType.AGENCY_SUBMITTER
                and user.agency_id is not None
            ):
                return True
        return False


class IsAgencyInputter(IsAgency):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if (
                user.user_type == user.UserType.AGENCY_INPUTTER
                and user.agency_id is not None
            ):
                return True
        return False


class IsCountryUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if (
                user.user_type
                in (user.UserType.COUNTRY_USER, user.UserType.COUNTRY_SUBMITTER)
                and user.country_id is not None
            ):
                return True
        return False

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the object

        If the object does not have a country_id attribute, return True.
        Else check if the user's country_id matches the object's country_id.

        """
        if getattr(obj, "country_id", "no attr") == "no attr":
            return True

        if request.user.country_id == obj.country_id:
            return True

        return False
