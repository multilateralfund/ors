from django.conf import settings
from django.contrib.auth.models import Permission
from rest_framework import views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class UserPermissionsView(views.APIView):
    """
    API endpoint that gives the user's permissions list
    """

    def get(self, *args, **kwargs):
        permissions = []
        user = self.request.user
        if not user:
            return Response(permissions, status=404)
        if user.is_superuser:
            perm_objects = Permission.objects.all()
        else:
            perm_objects = Permission.objects.filter(group__user=user).distinct()
        permissions = [obj.codename for obj in perm_objects]
        return Response(permissions)


class AuthDebugView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        raw_token = auth_header.split(" ", 1)[1] if auth_header.startswith("Bearer ") else None

        data = {
                "ok": True,
                "user_id": request.user.id,
                "username": request.user.get_username(),
                "is_authenticated": request.user.is_authenticated,
                "auth_type": type(request.successful_authenticator).__name__
                if request.successful_authenticator
                else None,
            "request_auth": str(request.auth),  # often decoded token info/object
            }
        if settings.DEBUG:
            data["raw_token"] = raw_token
        return Response(data)
