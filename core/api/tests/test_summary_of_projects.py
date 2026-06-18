import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import ProjectClusterFactory, ProjectFactory


pytestmark = pytest.mark.django_db


class TestSummaryOfProjectsFilters(BaseTest):
    url = reverse("summary-of-projects-filters")

    def test_cluster_options_include_code(self, admin_user):
        cluster = ProjectClusterFactory.create(
            name="Kigali Implementation Plan Stage 1",
            code="KIP1",
        )
        ProjectFactory.create(cluster=cluster)

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)

        assert response.status_code == 200
        assert response.data["cluster"] == [
            {
                "id": cluster.id,
                "name": "Kigali Implementation Plan Stage 1",
                "code": "KIP1",
            }
        ]
