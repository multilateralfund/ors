from django.urls import path

from core.api.views.chemicals import GroupSubstancesListAPIView
from core.api.views.usages import UsageListAPIView
from core.api.views.blend import BlendsListAPIView

urlpatterns = [
    path("usages/", UsageListAPIView.as_view(), name="usages-list"),
    path(
        "group-substances/",
        GroupSubstancesListAPIView.as_view(),
        name="group-substances-list",
    ),
    path('blends/', BlendsListAPIView.as_view(), name="blends-list")
]
