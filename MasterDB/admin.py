from django.contrib import admin
from django.contrib import messages
import csv
from django.shortcuts import render
from django.urls import path
from import_export.admin import ImportExportModelAdmin
# Register your models here.
from .models import Substance, Blend, BlendSubstance

class SubstanceAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = ('substance_name','substance_formula','substance_isomers','substance_odp','substance_gwp','substance_polyol')



class BlendAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    def composition(self, obj):
        res = []

        for blend_substance in obj.blend.all():
            substance = blend_substance.substance
            percentage = blend_substance.percentage
            res.append (f"{substance.substance_name}: {percentage}%")

        #import pdb; pdb.set_trace()
        return res
    
    composition.short_description = "Composition"

    list_display = ('blend_name','composition',)

admin.site.register(Substance, SubstanceAdmin)
admin.site.register(Blend, BlendAdmin)



