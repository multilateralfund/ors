from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.price import Price


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_final_display_list(Price, [])
