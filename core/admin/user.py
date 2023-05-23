from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from core.models.user import User

admin.site.register(User, UserAdmin)
