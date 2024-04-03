from rest_framework import permissions


class IsUserAllowedCP(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.is_country_user or user.is_secretariat:
                return True
            if request.method in permissions.SAFE_METHODS:
                return True
        return False
