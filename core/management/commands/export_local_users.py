import json
import os

from constance import config
from django.conf import settings
from django.core.management import BaseCommand
from rest_framework.authtoken.models import Token

from core.models import User

# Constance keys that hold environment-specific email settings. They are
# exported with the users so a restore from production does not leave
# staging sending notifications to production recipients.
EMAIL_CONSTANCE_KEYS = [
    "SEND_MAIL",
    "CP_NOTIFICATION_EMAILS",
    *settings.EMAILS_CONSTANCE_FIELDS.keys(),
]


def serialize_user(user):
    try:
        token = user.auth_token.key
    except Token.DoesNotExist:
        token = None

    return {
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "password": user.password,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_external_service": user.is_external_service,
        "user_type": user.user_type,
        "country": user.country.name if user.country else None,
        "agency": user.agency.name if user.agency else None,
        "groups": sorted(user.groups.values_list("name", flat=True)),
        "user_permissions": sorted(
            f"{p.content_type.app_label}.{p.codename}"
            for p in user.user_permissions.select_related("content_type")
        ),
        "api_token": token,
    }


class Command(BaseCommand):
    help = """
        Export the local user accounts (and the email-related constance
        settings) of this environment to a JSON file, so they can be
        re-applied with `post_prod_restore` after restoring a production
        database dump. See docs/prod_to_staging.md.

        The output contains password hashes and API tokens: treat it as a
        secret and delete it once the restore is done.
    """

    def add_arguments(self, parser):
        parser.add_argument("--out", required=True, help="Output JSON file path")
        parser.add_argument(
            "--username",
            action="append",
            dest="usernames",
            help="Only export these usernames (repeatable). Default: all users.",
        )
        parser.add_argument(
            "--active-only",
            action="store_true",
            help="Skip inactive users",
        )

    def handle(self, *args, **options):
        users = User.objects.select_related("country", "agency").order_by("username")
        if options["usernames"]:
            users = users.filter(username__in=options["usernames"])
            missing = set(options["usernames"]) - set(
                users.values_list("username", flat=True)
            )
            if missing:
                self.stderr.write(
                    self.style.WARNING(f"Usernames not found: {sorted(missing)}")
                )
        if options["active_only"]:
            users = users.filter(is_active=True)

        payload = {
            "source_database": settings.DATABASES["default"]["NAME"],
            "users": [serialize_user(u) for u in users],
            "constance": {
                key: getattr(config, key)
                for key in EMAIL_CONSTANCE_KEYS
                if key in settings.CONSTANCE_CONFIG
            },
        }

        out = options["out"]
        fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(payload['users'])} users and "
                f"{len(payload['constance'])} constance settings to {out}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                "The file contains password hashes and API tokens - "
                "keep it private and delete it after the restore."
            )
        )
