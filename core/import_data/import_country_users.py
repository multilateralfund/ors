import logging
import pandas as pd

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

from core.import_data.mapping_names_dict import COUNTRY_NAME_MAPPING
from core.models.country import Country
from core.tasks import send_mail_set_password_country_user

User = get_user_model()
logger = logging.getLogger(__name__)


def make_user(row, user_type):
    full_name = row["Full Name"]
    for substr in ("Ms", "Mr", "Mrs", "Md", "Dr", "."):
        full_name = full_name.replace(substr, "")

    full_name = full_name.strip().rsplit(" ", 1)
    first_name = full_name[0]
    last_name = full_name[1] if len(full_name) > 1 else ""

    country_name = COUNTRY_NAME_MAPPING.get(
        row["Country/Region"], row["Country/Region"]
    )
    country = Country.objects.find_by_name(country_name)
    username = (
        f"{country.name}_inputter"
        if user_type == User.UserType.COUNTRY_USER
        else f"{country.name}_submitter"
    )

    user_kwargs = {
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "email": row["Email"].strip(),
        "country": country,
        "user_type": user_type,
        "is_superuser": False,
        "is_staff": False,
        "is_active": True,
    }

    return User(**user_kwargs)


def import_country_users():
    users_to_create = []
    file_path = settings.IMPORT_DATA_DIR / "users/country_users.xlsx"

    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        for user_type in (User.UserType.COUNTRY_USER, User.UserType.COUNTRY_SUBMITTER):
            user = make_user(row, user_type)
            users_to_create.append(user)

    with transaction.atomic():
        User.objects.bulk_create(
            users_to_create,
            update_conflicts=True,
            unique_fields=["username"],
            update_fields=["first_name", "last_name", "email"],
        )

    if users_to_create:
        transaction.on_commit(
            lambda: send_mail_set_password_country_user.apply_async(
                args=(
                    list(dict.fromkeys([user.country_id for user in users_to_create])),
                )
            )
        )

    logger.info("✔ Country users imported.")
