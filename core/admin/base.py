from django.contrib import admin
from django.contrib.auth.models import Group

from core.models.base import Module


class TaggedAdminSite(admin.AdminSite):
    """
    Allows an admin_group set on the Admin class to override de app_label in order
    to allow tagging in different sections the models of the same app.
    """

    def get_app_list(self, request, app_label=None):
        apps = super().get_app_list(request)

        model_groups = {
            f"{model._meta.app_label}.{model._meta.model_name}": getattr(
                admin_class, "admin_group", None
            )
            for model, admin_class in self._registry.items()
        }

        grouped = {}
        count = 0
        for app_index, app in enumerate(apps):
            for model in app["models"]:
                registry_key = f"{app['app_label']}.{model['object_name'].lower()}"
                if model_groups.get(registry_key):
                    tag = model_groups.get(registry_key)
                    index = ""
                else:
                    index = str(count)
                    count += 1

                tag = model_groups.get(registry_key) or app["app_label"]
                group = grouped.setdefault(
                    tag,
                    {
                        "app_label": tag,
                        "name": tag,
                        "app_url": app["app_url"],
                        "has_module_perms": True,
                        "models": [],
                        "order": index + tag,
                        "_sort_key": (app_index, app["app_label"]),
                    },
                )
                group["models"].append(model)

        for group in grouped.values():
            group["models"].sort(key=lambda m: m["name"])
        return sorted(
            grouped.values(), key=lambda item: (item["order"], item["_sort_key"])
        )


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    admin_group = "Common"
    search_fields = [
        "name",
    ]
    list_display = [
        "code",
        "name",
        "description",
    ]


try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    admin_group = "Auth"
    search_fields = ["name"]
    list_display = ["name"]
