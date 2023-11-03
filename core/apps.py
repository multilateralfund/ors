import logging

from django.apps import AppConfig
from django.conf import settings
from django.contrib.auth import get_user_model


logger = logging.getLogger(__name__)


def create_printer_user():
    User = get_user_model()
    obj, created = User.objects.get_or_create(username=settings.PRINTER_USERNAME)
    obj.set_password(settings.PRINTER_USER_PASSWORD)
    obj.save()
    logger.debug("Printer user %s configured: created=%s", obj, created)


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        create_printer_user()
