import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.project_completion_report import (
    PCRDelayCategory,
    PCRLearnedLessonCategory,
    PCRProjectComponentOption,
)


pytestmark = pytest.mark.django_db


@pytest.fixture(name="client")
def _client():
    return APIClient()


@pytest.mark.parametrize(
    ("model", "url_name"),
    [
        (PCRProjectComponentOption, "pcr-project-component-option-list"),
        (PCRDelayCategory, "pcr-delay-category-list"),
        (PCRLearnedLessonCategory, "pcr-learned-lesson-category-list"),
    ],
)
def test_pcr_lookup_lists_active_options_ordered_by_sort_order_and_name(
    client, admin_user, model, url_name
):
    later = model.objects.really_all().create(
        name=f"{url_name} later",
        sort_order=2,
        obsolete=False,
    )
    first_by_name = model.objects.really_all().create(
        name=f"{url_name} alpha",
        sort_order=1,
        obsolete=False,
    )
    second_by_name = model.objects.really_all().create(
        name=f"{url_name} beta",
        sort_order=1,
        obsolete=False,
    )
    model.objects.really_all().create(
        name=f"{url_name} obsolete",
        sort_order=0,
        obsolete=True,
    )
    client.force_authenticate(user=admin_user)

    response = client.get(reverse(url_name))

    assert response.status_code == 200
    assert response.data == [
        {"id": first_by_name.id, "name": first_by_name.name, "sort_order": 1.0},
        {"id": second_by_name.id, "name": second_by_name.name, "sort_order": 1.0},
        {"id": later.id, "name": later.name, "sort_order": 2.0},
    ]


@pytest.mark.parametrize(
    "url_name",
    [
        "pcr-project-component-option-list",
        "pcr-delay-category-list",
        "pcr-learned-lesson-category-list",
    ],
)
def test_pcr_lookup_lists_require_project_view_access(client, user, url_name):
    response = client.get(reverse(url_name))
    assert response.status_code == 403

    client.force_authenticate(user=user)
    response = client.get(reverse(url_name))
    assert response.status_code == 403
