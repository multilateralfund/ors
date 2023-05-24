from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from core.models import (Substance, Group, Usage)
from .serializers import (SubstanceSerializer, GroupSerializer, UsageSerializer)


class SubstanceListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        substances = Group.objects.all()
        output = GroupSerializer(substances, many=True)
        return Response(output.data, status=status.HTTP_200_OK)
    
class UsageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        usages = Usage.objects.all()
        output = UsageSerializer(usages, many=True)
        return Response(output.data, status=status.HTTP_200_OK)