from django import template
from django.conf import settings
 
register = template.Library()

@register.simple_tag
def frontend_host():
    return getattr(settings, 'FRONTEND_HOST', "")[0]