from django.urls import path
from .views import UsageListAPIView

urlpatterns = [
    path("usages/", UsageListAPIView.as_view(), name="usages-list"),
]
