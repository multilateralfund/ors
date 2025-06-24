from rest_framework import views
from rest_framework.response import Response
from django.contrib.auth.models import Permission


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
