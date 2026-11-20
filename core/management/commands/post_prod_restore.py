import json

from constance import config
from django.conf import settings
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX
from django.contrib.auth.models import Group, Permission
from django.contrib.sessions.models import Session
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from django.db.models import CharField, Value
from django.db.models.functions import Cast, Concat
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from core.models import Agency, Country, User

# pylint: disable=R0914,R0915,W0201

USER_FIELDS = [
    "email",
    "first_name",
    "last_name",
    "password",
    "is_active",
    "is_staff",
    "is_superuser",
    "is_external_service",
    "user_type",
]


class DryRunRollback(Exception):
    pass


class Command(BaseCommand):
    help = """
        Run on a NON-production environment right after restoring a
        production database dump (and running migrations). It:

          1. logs everybody out (sessions + DRF tokens);
          2. makes every production account's password unusable;
          3. optionally rewrites production emails to <id>@example.invalid;
          4. re-creates / updates the local accounts exported earlier with
             `export_local_users` (matched by username);
          5. restores the local email-related constance settings.

        Everything runs in one transaction. See docs/prod_to_staging.md.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "users_file", help="JSON file produced by export_local_users"
        )
        parser.add_argument(
            "--confirm-db",
            required=True,
            help="Name of the database you are modifying (safety check)",
        )
        parser.add_argument(
            "--scrub-emails",
            action="store_true",
            help="Rewrite the emails of production users to "
            "user-<id>@example.invalid",
        )
        parser.add_argument(
            "--deactivate-prod-users",
            action="store_true",
            help="Also set is_active=False on production users (they are "
            "locked out either way; this also hides them from active-user "
            "lists such as notification recipients)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do everything and print the summary, then roll back",
        )

    def handle(self, *args, **options):
        db_name = settings.DATABASES["default"]["NAME"]
        if options["confirm_db"] != db_name:
            raise CommandError(
                f"--confirm-db={options['confirm_db']!r} does not match the "
                f"configured database {db_name!r}. Refusing to run."
            )
        if getattr(settings, "SENTRY_ENVIRONMENT", "") == "production":
            raise CommandError("SENTRY_ENVIRONMENT is 'production'. Refusing to run.")

        with open(options["users_file"], encoding="utf8") as f:
            payload = json.load(f)

        self.warnings = []
        try:
            with transaction.atomic():
                self._run(payload, options)
                if options["dry_run"]:
                    raise DryRunRollback()
        except DryRunRollback:
            self.stdout.write(self.style.WARNING("Dry run: all changes rolled back."))

        for w in self.warnings:
            self.stdout.write(self.style.WARNING(f"WARNING: {w}"))
        self.stdout.write(self.style.SUCCESS("Done."))

    def _run(self, payload, options):
        local_users = payload["users"]
        local_usernames = [u["username"] for u in local_users]

        # 1. Log everybody out. JWTs are signed with SECRET_KEY, so they are
        #    invalid here as long as staging uses its own DJANGO_SECRET_KEY.
        sessions, _ = Session.objects.all().delete()
        tokens, _ = Token.objects.all().delete()
        self.stdout.write(f"Deleted {sessions} sessions and {tokens} API tokens")

        # 2. Lock out the production accounts.
        prod_users = User.objects.exclude(username__in=local_usernames)
        unusable = UNUSABLE_PASSWORD_PREFIX + get_random_string(40)
        update = {"password": unusable}
        if options["deactivate_prod_users"]:
            update["is_active"] = False
        locked = prod_users.update(**update)
        self.stdout.write(f"Locked {locked} production accounts")

        # 3. Optionally scrub their emails.
        if options["scrub_emails"]:
            scrubbed = prod_users.exclude(email="").update(
                email=Concat(
                    Value("user-"),
                    Cast("id", output_field=CharField()),
                    Value("@example.invalid"),
                    output_field=CharField(),
                )
            )
            self.stdout.write(f"Scrubbed {scrubbed} production emails")

        # 4. Re-apply local accounts.
        created = updated = 0
        for data in local_users:
            user = User.objects.filter(username=data["username"]).first()
            if user is None:
                user = User(username=data["username"])
                created += 1
            else:
                updated += 1

            for field in USER_FIELDS:
                setattr(user, field, data[field])
            user.country = self._get_by_name(Country, data["country"], user)
            user.agency = self._get_by_name(Agency, data["agency"], user)
            user.save()

            if data["email"]:
                clash = prod_users.filter(email__iexact=data["email"]).values_list(
                    "username", flat=True
                )
                if clash:
                    self.warnings.append(
                        f"{user.username}: email {data['email']} is also used by "
                        f"production user(s) {list(clash)}"
                    )

            groups = []
            for name in data["groups"]:
                group = Group.objects.filter(name=name).first()
                if group:
                    groups.append(group)
                else:
                    self.warnings.append(
                        f"{user.username}: group {name!r} does not exist "
                        f"(run `import_user_permissions import_user_groups` and re-run)"
                    )
            user.groups.set(groups)

            perms = []
            for perm in data["user_permissions"]:
                app_label, codename = perm.split(".", 1)
                p = Permission.objects.filter(
                    content_type__app_label=app_label, codename=codename
                ).first()
                if p:
                    perms.append(p)
                else:
                    self.warnings.append(
                        f"{user.username}: permission {perm!r} does not exist"
                    )
            user.user_permissions.set(perms)

            if data.get("api_token"):
                Token.objects.create(key=data["api_token"], user=user)

        self.stdout.write(
            f"Local accounts: {created} created, {updated} updated "
            f"(matched by username)"
        )

        # 5. Restore local email settings.
        restored = 0
        for key, value in payload.get("constance", {}).items():
            if key in settings.CONSTANCE_CONFIG:
                setattr(config, key, value)
                restored += 1
            else:
                self.warnings.append(f"constance key {key!r} no longer exists")
        self.stdout.write(f"Restored {restored} email constance settings")

    def _get_by_name(self, model, name, user):
        if not name:
            return None
        obj = model.objects.filter(name=name).first()
        if obj is None:
            self.warnings.append(
                f"{user.username}: {model.__name__} {name!r} not found, left empty"
            )
        return obj
