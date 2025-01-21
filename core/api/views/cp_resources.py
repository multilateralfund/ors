from django.conf import settings
from rest_framework import generics, mixins, status
from rest_framework.response import Response


class CPResourcesView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows CP resources to be viewed.
    """

    def get(self, request, *args, **kwargs):
        data = {}
        dir_path = settings.STATIC_ROOT / "resources"

        for file in dir_path.glob("*"):
            file_path = str(dir_path / file.name)
            data[file.name] = file_path

        return Response(data, status=status.HTTP_200_OK)
