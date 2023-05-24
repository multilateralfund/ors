from django.urls import path
from .views import (
    SubstanceListView,
    UsageView
)

urlpatterns = [
    path('substances/', SubstanceListView.as_view()),
    path('usages/', UsageView.as_view()),
]