from django.db import models

# Create your models here.

#substance model
class Substance(models.Model):
    substance_name = models.CharField(max_length=100)
    substance_description = models.TextField(null=True, blank=True)
    substance_formula = models.CharField(max_length=100, null=True, blank=True)
    substance_isomers = models.IntegerField(null=True, blank=True)
    substance_odp = models.FloatField(null=True, blank=True)
    substance_gwp = models.FloatField(null=True, blank=True)
    substance_polyol = models.BooleanField(default=False)

    def __str__(self):
        return self.substance_name
    
#blend model
class Blend(models.Model):
    blend_name = models.CharField(max_length=100)
    blend_description = models.TextField(null=True, blank=True)
    #the blend contains multiple substances, each with a percentage
    blend_substances = models.ManyToManyField(Substance, through='BlendSubstance')
    blend_odp = models.FloatField(null=True, blank=True)
    blend_gwp = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.blend_name
    
class BlendSubstance(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE,related_name='blend')
    substance = models.ForeignKey(Substance, on_delete=models.CASCADE, related_name='substance')
    percentage = models.FloatField()

    def __str__(self):
        return self.blend.blend_name + " " + self.substance.substance_name + " " + self.percentage
    
#country model; contains name, m49 code, and iso code
class Country(models.Model):
    country_name = models.CharField(max_length=100)
    country_m49 = models.IntegerField(null=True, blank=True)
    country_iso = models.CharField(max_length=3, null=True, blank=True)

    def __str__(self):
        return self.country_name
    
#model with how a substance can be used; contains name, description; a usage also can have a parent usage
class Usage(models.Model):
    usage_name = models.CharField(max_length=100)
    usage_description = models.TextField()
    usage_parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='parent')

    def __str__(self):
        return self.usage_name`
