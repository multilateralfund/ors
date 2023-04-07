from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import Blend, BlendComponents, Group, Substance, User

admin.site.register(User, UserAdmin)


def get_final_display_list(cls, exclude):
    return [field.name for field in cls._meta.get_fields() if field.name not in exclude]


@admin.register(Substance)
class SubstanceAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["blendcomponents"]
        return get_final_display_list(Substance, exclude)


@admin.register(Blend)
class BlendAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["blendcomponents"]
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
