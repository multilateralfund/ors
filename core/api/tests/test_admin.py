import pytest

from django.contrib import admin
from django.urls import reverse

from django.test import Client

pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_admin_listing")
def setup_admin_listing(
    blend, bp_activity, bp_chemical_type, business_plan, decision, meta_project, meeting,
    new_country, project, project_type, project_status, substance, _setup_new_cp_report, 
):
    pass


class TestAdminListingResponse:
    client = Client()


    def test_get_200_on_admin_endpoints_listing(self, admin_user, _setup_admin_listing):

        self.client.force_login(user=admin_user)
        # get all admin listing urls

        urls = []
        for model, model_admin in admin.site._registry.items():
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            urls.append(reverse(f"admin:{app_label}_{model_name}_changelist"))

        for url in urls:
            response = self.client.get(url)
            assert response.status_code == 200, f"Failed to access {url} with status code {response.status_code}"
