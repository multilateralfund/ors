from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import (
    Blend,
    BlendComponents,
    Country,
    CountryProgrammeReport,
    Group,
    Price,
    CountryProgrammeRecord,
    Subregion,
    Substance,
    Region,
    Usage,
    User,
)
from core.models.agency import Agency
from core.models.blend import BlendAltName
from core.models.country_programme import CountryProgrammeUsage
from core.models.project_sector import ProjectSector, ProjectSubSector
from core.models.project_submission import ProjectSubmission
from core.models.substance import SubstanceAltName
from core.models.usage import ExcludedUsage

admin.site.register(User, UserAdmin)


def get_final_display_list(cls, exclude):
    return [field.name for field in cls._meta.get_fields() if field.name not in exclude]


@admin.register(SubstanceAltName)
class SubstanceAltNameAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "substance__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(SubstanceAltName, [])


@admin.register(Substance)
class SubstanceAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "formula",
    ]

    def get_list_display(self, request):
        exclude = [
            "blendcomponents",
            "price",
            "countryprogrammerecord",
            "substancealtname",
            "excludedusage",
        ]
        return get_final_display_list(Substance, exclude)


@admin.register(Blend)
class BlendAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "composition",
        "composition_alt",
        "other_names",
        "trade_name",
    ]
    list_filter = ["type"]

    def get_list_display(self, request):
        exclude = [
            "blendcomponents",
            "price",
            "countryprogrammerecord",
            "blendaltname",
            "excludedusage",
        ]
        return get_final_display_list(Blend, exclude)


@admin.register(BlendAltName)
class BlendAltNameAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "blend__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(BlendAltName, [])


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "name_alt",
    ]

    def get_list_display(self, request):
        exclude = ["substances"]
        return get_final_display_list(Group, exclude)


@admin.register(BlendComponents)
class BlendComponentsAdmin(admin.ModelAdmin):
    search_fields = [
        "blend__name",
        "substance__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(BlendComponents, [])


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "name_alt",
        "full_name",
        "iso3",
        "abbr",
        "abbr_alt",
    ]
    list_filter = ["subregion", "subregion__region"]

    def get_list_display(self, request):
        exclude = ["countryprogrammereport", "projectsubmission"]
        return get_final_display_list(Country, exclude)


@admin.register(Subregion)
class SubregionAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = ["region"]

    def get_list_display(self, request):
        exclude = ["country"]
        return get_final_display_list(Subregion, exclude)


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["subregion"]
        return get_final_display_list(Region, exclude)


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_final_display_list(Price, [])


@admin.register(Usage)
class UsageAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "full_name",
    ]

    def get_list_display(self, request):
        exclude = ["usage", "countryprogrammeusage", "excludedusage"]
        return get_final_display_list(Usage, exclude)


@admin.register(ExcludedUsage)
class ExcludedUsageAdmin(admin.ModelAdmin):
    search_fields = [
        "blend__name",
        "substance__name",
        "usage__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(ExcludedUsage, [])


@admin.register(CountryProgrammeRecord)
class CountryProgrammeRecordAdmin(admin.ModelAdmin):
    list_filter = [
        "country_programme_report__year",
        "country_programme_report__country",
    ]

    def get_country(self, obj):
        return obj.country_programme_report.country

    get_country.short_description = "Country"

    def get_year(self, obj):
        return obj.country_programme_report.year

    get_year.short_description = "Year"

    def get_list_display(self, request):
        exclude = ["source", "countryprogrammeusage"]
        return get_final_display_list(CountryProgrammeRecord, exclude) + [
            "get_year",
            "get_country",
        ]


@admin.register(CountryProgrammeReport)
class CountryProgrammeReportAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = ["year", "country"]

    def get_list_display(self, request):
        exclude = ["price", "countryprogrammerecord", "usage", "comment"]
        return get_final_display_list(CountryProgrammeReport, exclude)


@admin.register(CountryProgrammeUsage)
class CountryProgrammeUsageAdmin(admin.ModelAdmin):
    list_filter = [
        "usage",
    ]
    search_fields = [
        "usage__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(CountryProgrammeUsage, [])


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubsector"]
        return get_final_display_list(ProjectSector, exclude)


@admin.register(ProjectSubSector)
class ProjectSubSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        "sector",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubmission"]
        return get_final_display_list(ProjectSubSector, exclude)


@admin.register(ProjectSubmission)
class ProjectSubmissionAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]
    list_filter = [
        "type",
        "agency",
        "category",
    ]

    def get_list_display(self, request):
        exclude = ["submissionodsodp", "submissionamount"]
        return get_final_display_list(ProjectSubmission, exclude)


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubmission"]
        return get_final_display_list(Agency, exclude)
