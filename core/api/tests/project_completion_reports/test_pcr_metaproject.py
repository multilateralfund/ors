from django.urls import reverse
from core.api.tests.base import BaseTest

from core.api.tests.factories import (
    ProjectFactory,
    MetaProjectFactory,
    PCRFactory,
    PCRProjectFactory,
)
import pytest

# pylint: disable=too-many-arguments,too-many-locals,too-many-statements

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_pcr_meta_project_list")
def setup_pcr_meta_project_list(
    new_agency,
    other_agency,
    agency,
    country_ro,
    country_europe,
    new_country,
    project_approved_status,
    project_draft_status,
    project_cluster_kip,
    project_cluster_kpp,
    project_type,
    new_project_type,
    sector,
    sector_other,
    subsector,
    subsector_other_sector_other,
    project_completed_status,
    project_financially_completed_status,
):
    country_ro.parent = country_europe
    country_ro.save()
    meta_project1 = MetaProjectFactory(
        country=new_country, umbrella_code="xyz1", cluster=project_cluster_kip
    )
    meta_project2 = MetaProjectFactory(
        country=country_ro, umbrella_code="xyz2", cluster=project_cluster_kpp
    )
    pcr2 = PCRFactory(meta_project=meta_project2, submission_date="2026-08-08")

    projects = []
    project1 = ProjectFactory.create(
        title="Project 1",
        agency=agency,
        sector=sector,
        category="Individual",
        lead_agency=agency,
        project_type=project_type,
        country=new_country,
        meta_project=meta_project1,
        ad_hoc_pcr=True,
        submission_status=project_approved_status,
        metacode=meta_project1.umbrella_code,
        cluster=project_cluster_kip,
        status=project_completed_status,
        lead_agency_submitting_on_behalf=True,
    )
    project1.subsectors.add(*[subsector_other_sector_other, subsector])
    projects.append(project1)
    project2 = ProjectFactory.create(
        title="Project 2",
        agency=new_agency,
        lead_agency=other_agency,
        sector=sector_other,
        category="Multi-year agreement",
        country=country_ro,
        project_type=new_project_type,
        meta_project=meta_project2,
        ad_hoc_pcr=False,
        submission_status=project_approved_status,
        metacode=meta_project2.umbrella_code,
        cluster=project_cluster_kpp,
        status=project_financially_completed_status,
        lead_agency_submitting_on_behalf=True,
    )
    project2.subsectors.add(*[subsector_other_sector_other])
    projects.append(project2)
    PCRProjectFactory(pcr=pcr2, project=project2)
    project3 = ProjectFactory.create(
        title="Project 3",
        agency=new_agency,
        lead_agency=other_agency,
        category="Multi-year agreement",
        country=country_ro,
        sector=sector_other,
        project_type=new_project_type,
        meta_project=meta_project2,
        ad_hoc_pcr=False,
        submission_status=project_draft_status,
        metacode=meta_project2.umbrella_code,
        cluster=project_cluster_kpp,
    )
    projects.append(project3)

    return projects


class TestPCRMetaprojectsViewSet(BaseTest):

    url = reverse("pcr-metaprojects-list")

    @pytest.mark.skip(reason="PCR permissions not yet implemented")
    def test_project_list_permissions(
        self,
        _setup_pcr_meta_project_list,
    ):
        pass

    def test_list(self, admin_user, _setup_pcr_meta_project_list):
        projects = _setup_pcr_meta_project_list
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == projects[0].id
        assert response.data[1]["id"] == projects[1].id

    def test_filters(
        self,
        admin_user,
        _setup_pcr_meta_project_list,
        agency,
        country_europe,
        country_ro,
        project_cluster_kip,
        new_project_type,
        sector,
        subsector,
        subsector_other_sector_other,
        project_completed_status,
        project_financially_completed_status,
        new_agency,
    ):
        projects = _setup_pcr_meta_project_list
        self.client.force_authenticate(user=admin_user)

        # region
        response = self.client.get(self.url, {"region_id": country_europe.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # cooperating agencies
        response = self.client.get(self.url, {"cooperating_agency_id": new_agency.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # agency
        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        # country
        response = self.client.get(self.url, {"country_id": country_ro.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # lead agency
        response = self.client.get(self.url, {"lead_agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        # cluster
        response = self.client.get(self.url, {"cluster_id": project_cluster_kip.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        # type
        response = self.client.get(self.url, {"project_type_id": new_project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # sector
        response = self.client.get(self.url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        # subsectors
        response = self.client.get(self.url, {"subsectors": [subsector.id]})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        response = self.client.get(
            self.url, {"subsectors": [subsector_other_sector_other.id]}
        )
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == projects[0].meta_project.id
        assert response.data[1]["id"] == projects[1].meta_project.id

        # category
        response = self.client.get(self.url, {"category": "Multi-year agreement"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # operationally completed
        response = self.client.get(
            self.url,
            {
                "status_id": [
                    project_completed_status.id,
                    project_financially_completed_status.id,
                ]
            },
        )
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == projects[0].meta_project.id
        assert response.data[1]["id"] == projects[1].meta_project.id

        # pcr due

        # TODO: test PCR due once the condition is implemented

        # ad-hoc PCR
        response = self.client.get(self.url, {"ad_hoc_pcr": "Yes"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        response = self.client.get(self.url, {"ad_hoc_pcr": "No"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        # pcr submitted
        response = self.client.get(self.url, {"pcr_submitted": "Yes"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[1].meta_project.id

        response = self.client.get(self.url, {"pcr_submitted": "No"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        # pcr submission date

        project1 = projects[0]
        pcr1 = PCRFactory(
            meta_project=project1.meta_project, submission_date="2026-07-08"
        )
        PCRProjectFactory(pcr=pcr1, project=project1)

        response = self.client.get(
            self.url,
            {
                "pcr_submission_date_before": "2026-07-24",
                "pcr_submission_date_after": "2026-06-24",
            },
        )
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == projects[0].meta_project.id

        response = self.client.get(
            self.url,
            {
                "pcr_submission_date_before": "2026-08-24",
                "pcr_submission_date_after": "2026-06-24",
            },
        )
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == projects[0].meta_project.id
        assert response.data[1]["id"] == projects[1].meta_project.id
