from rest_framework import generics

from core.models.rbm_measures import RBMMeasure
from core.api.serializers.rbm_measure import RBMMeasureSerializer


from drf_spectacular.utils import extend_schema, extend_schema_view


@extend_schema_view(get=extend_schema(deprecated=True))
class RBMMeasureListView(generics.ListAPIView):
    queryset = RBMMeasure.objects.order_by("sort_order").all()
    serializer_class = RBMMeasureSerializer
