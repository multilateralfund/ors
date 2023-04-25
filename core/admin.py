from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import (
    Blend,
    BlendComponents,
    Country,
    CountryProgrammeReport,
    Group,
    Price,
    Record,
    Subregion,
    Substance,
    Region,
    Usage,
    User,
)

admin.site.register(User, UserAdmin)


def get_final_display_list(cls, exclude):
    return [field.name for field in cls._meta.get_fields() if field.name not in exclude]


@admin.register(Substance)
class SubstanceAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["blendcomponents", "price", "record"]
        return get_final_display_list(Substance, exclude)


@admin.register(Blend)
class BlendAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["blendcomponents", "price", "record"]
        return get_final_display_list(Blend, exclude)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["substances"]
        return get_final_display_list(Group, exclude)


@admin.register(BlendComponents)
class BlendComponentsAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_final_display_list(BlendComponents, [])


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["countryprogrammereport"]
        return get_final_display_list(Country, exclude)


@admin.register(Subregion)
class SubregionAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["country"]
        return get_final_display_list(Subregion, exclude)


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["subregion"]
        return get_final_display_list(Region, exclude)


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_final_display_list(Price, [])


@admin.register(Usage)
class UsageAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["usage", "record"]
        return get_final_display_list(Usage, exclude)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_final_display_list(Record, [])


@admin.register(CountryProgrammeReport)
class CountryProgrammeReportAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["price", "record", "usage"]
        return get_final_display_list(CountryProgrammeReport, exclude)
