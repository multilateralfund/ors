from django.contrib import admin
from core.models.base import Module


class TaggedAdminSite(admin.AdminSite):
    """
    Allows an admin_group set on the Admin class to override de app_label in order
    to allow tagging in different sections the models of the same app.
    """

    def get_app_list(self, request, app_label=None):
        apps = super().get_app_list(request)

        model_groups = {
            model._meta.model_name: getattr(admin_class, "admin_group", None)
            for model, admin_class in self._registry.items()
        }

        grouped = {}
        for app_index, app in enumerate(apps):
            for model in app["models"]:
                tag = model_groups.get(model["object_name"].lower()) or app["app_label"]
                group = grouped.setdefault(
                    tag,
                    {
                        "app_label": tag,
                        "name": tag,
                        "app_url": app["app_url"],
                        "has_module_perms": True,
                        "models": [],
                        "_sort_key": (app_index, app["app_label"]),
                    },
                )
                group["models"].append(model)

        return sorted(grouped.values(), key=lambda item: item["_sort_key"])


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_display = [
        "code",
        "name",
        "description",
    ]
