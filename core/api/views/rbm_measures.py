from rest_framework import generics

from core.models.rbm_measures import RBMMeasure
from core.api.serializers.rbm_measure import RBMMeasureSerializer


class RBMMeasureListView(generics.ListAPIView):
    queryset = RBMMeasure.objects.order_by("sort_order").all()
    serializer_class = RBMMeasureSerializer
