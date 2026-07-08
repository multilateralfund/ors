from datetime import datetime, timezone as dt_timezone

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    AgencyFactory,
    CountryFactory,
    MetaProjectFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
)
from core.models.country import Country
from core.models.project import Project
from core.models.project_completion_report import PCR, PCRProject
from core.models.project_pcr_exclusion import ProjectPCRRequiredExclusionRule


pytestmark = pytest.mark.django_db

# pylint: disable=too-many-locals,unused-argument


def _results(response):
    if isinstance(response.data, dict) and "results" in response.data:
        return response.data["results"]
    return response.data


def _create_pcr_project(project, created_at):
    if not project.meta_project_id:
        project.meta_project = MetaProjectFactory.create(type=project.category)
        project.save(update_fields=["meta_project"])

    pcr = PCR.objects.create(meta_project=project.meta_project)
    pcr_project = PCRProject.objects.create(
        pcr=pcr,
        project=project,
        financial_figures_status=PCRProject.FinancialFiguresStatus.FINAL,
        project_goal_achieved=PCRProject.ProjectGoalAchieved.YES,
        rating=PCRProject.Rating.SATISFACTORY_PLANNED,
        completed_by=PCRProject.CompletedBy.LEAD_AGENCY,
    )
    PCRProject.objects.filter(pk=pcr_project.pk).update(date_created=created_at)
    pcr_project.refresh_from_db()
    return pcr_project


@pytest.fixture(name="pcr_listing_data")
def _pcr_listing_data():
    region_a = CountryFactory.create(
        name="PCR Region A", location_type=Country.LocationType.REGION
    )
    region_b = CountryFactory.create(
        name="PCR Region B", location_type=Country.LocationType.REGION
    )
    country_a = CountryFactory.create(name="PCR Country A", parent=region_a)
    country_b = CountryFactory.create(name="PCR Country B", parent=region_b)
    lead_agency_a = AgencyFactory.create(name="PCR Lead Agency A", code="PLA")
    lead_agency_b = AgencyFactory.create(name="PCR Lead Agency B", code="PLB")
    coop_agency_a = AgencyFactory.create(name="PCR Coop Agency A", code="PCA")
    coop_agency_b = AgencyFactory.create(name="PCR Coop Agency B", code="PCB")
    cluster_a = ProjectClusterFactory.create(name="PCR Cluster A", code="PCLA")
    cluster_b = ProjectClusterFactory.create(name="PCR Cluster B", code="PCLB")
    type_a = ProjectTypeFactory.create(name="PCR Type A", code="PTA")
    type_b = ProjectTypeFactory.create(name="PCR Type B", code="PTB")
    sector_a = ProjectSectorFactory.create(name="PCR Sector A", code="PSA")
    sector_b = ProjectSectorFactory.create(name="PCR Sector B", code="PSB")
    subsector_a = ProjectSubSectorFactory.create(
        name="PCR Subsector A", code="PSUA", sector=sector_a
    )
    subsector_b = ProjectSubSectorFactory.create(
        name="PCR Subsector B", code="PSUB", sector=sector_b
    )

    project_a = ProjectFactory.create(
        title="Unique Alpha Completion Title",
        metacode="PCR-META-001",
        category=Project.Category.IND,
        country=country_a,
        agency=coop_agency_a,
        lead_agency=lead_agency_a,
        lead_agency_submitting_on_behalf=True,
        cluster=cluster_a,
        project_type=type_a,
        sector=sector_a,
    )
    project_a.subsectors.set([subsector_a])

    project_b = ProjectFactory.create(
        title="Unique Beta Completion Title",
        metacode="PCR-META-002",
        category=Project.Category.MYA,
        country=country_b,
        agency=coop_agency_b,
        lead_agency=lead_agency_b,
        lead_agency_submitting_on_behalf=False,
        cluster=cluster_b,
        project_type=type_b,
        sector=sector_b,
    )
    project_b.subsectors.set([subsector_b])

    pcr_project_a = _create_pcr_project(
        project_a, datetime(2026, 5, 15, 10, 0, tzinfo=dt_timezone.utc)
    )
    pcr_project_b = _create_pcr_project(
        project_b, datetime(2026, 6, 15, 10, 0, tzinfo=dt_timezone.utc)
    )
    pcr_exclusion_rule = ProjectPCRRequiredExclusionRule.objects.create(
        name="PCR listing excluded type"
    )
    pcr_exclusion_rule.types.set([type_b])

    return {
        "pcr_project_a": pcr_project_a,
        "pcr_project_b": pcr_project_b,
        "project_a": project_a,
        "project_b": project_b,
        "region_a": region_a,
        "country_a": country_a,
        "lead_agency_a": lead_agency_a,
        "coop_agency_a": coop_agency_a,
        "coop_agency_b": coop_agency_b,
        "cluster_a": cluster_a,
        "type_a": type_a,
        "sector_a": sector_a,
        "subsector_a": subsector_a,
    }


@pytest.fixture(name="client")
def _client():
    return APIClient()


@pytest.fixture(name="url")
def _url():
    return reverse("project-completion-report-list")


def test_pcr_project_list_response_shape(client, url, admin_user, pcr_listing_data):
    client.force_authenticate(user=admin_user)

    response = client.get(url)

    assert response.status_code == 200
    rows = _results(response)
    row = next(
        item
        for item in rows
        if item["project_metacode"] == pcr_listing_data["project_a"].metacode
    )
    row_without_cooperating_agency = next(
        item
        for item in rows
        if item["project_metacode"] == pcr_listing_data["project_b"].metacode
    )
    assert row["project_id"] == pcr_listing_data["project_a"].id
    assert row["pcr_id"] == pcr_listing_data["pcr_project_a"].pcr_id
    assert row["country"] == "PCR Country A"
    assert row["lead_agency"] == "PCR Lead Agency A"
    assert row["cooperating_agencies"] == ["PCR Coop Agency A"]
    assert row["cooperating_agency_ids"] == [pcr_listing_data["coop_agency_a"].id]
    assert row_without_cooperating_agency["cooperating_agencies"] == []
    assert row_without_cooperating_agency["cooperating_agency_ids"] == []
    assert row["cluster"] == "PCR Cluster A"
    assert row["type"] == "PCR Type A"
    assert row["sector"] == "PCR Sector A"
    assert row["subsector"] == "PCR Subsector A"
    assert row["title"] == "Unique Alpha Completion Title"
    assert row["category"] == Project.Category.IND
    assert row["pcr_due"] is True
    assert row["pcr_submission_date"].startswith("2026-05-15T10:00:00")


def test_pcr_project_list_pagination(client, url, admin_user, pcr_listing_data):
    client.force_authenticate(user=admin_user)

    response = client.get(url, {"limit": 1, "offset": 0})

    assert response.status_code == 200
    assert response.data["count"] == 2
    assert len(response.data["results"]) == 1


def test_pcr_project_list_permissions(client, url, user, admin_user, pcr_listing_data):
    response = client.get(url)
    assert response.status_code == 403

    client.force_authenticate(user=user)
    response = client.get(url)
    assert response.status_code == 403

    client.force_authenticate(user=admin_user)
    response = client.get(url)
    assert response.status_code == 200


def test_pcr_project_filters(client, url, admin_user, pcr_listing_data):
    client.force_authenticate(user=admin_user)
    filter_cases = [
        ("region_id", pcr_listing_data["region_a"].id),
        ("country_id", pcr_listing_data["country_a"].id),
        ("lead_agency_id", pcr_listing_data["lead_agency_a"].id),
        ("cooperating_agency_id", pcr_listing_data["coop_agency_a"].id),
        ("cluster_id", pcr_listing_data["cluster_a"].id),
        ("project_type_id", pcr_listing_data["type_a"].id),
        ("sector_id", pcr_listing_data["sector_a"].id),
        ("subsector_id", pcr_listing_data["subsector_a"].id),
        ("category", Project.Category.IND),
        ("pcr_due", "true"),
    ]

    for param, value in filter_cases:
        response = client.get(url, {param: value})
        assert response.status_code == 200, param
        assert [row["project_metacode"] for row in _results(response)] == [
            "PCR-META-001"
        ], param

    response = client.get(url, {"pcr_due": "false"})
    assert response.status_code == 200
    assert [row["project_metacode"] for row in _results(response)] == ["PCR-META-002"]


def test_pcr_project_search(client, url, admin_user, pcr_listing_data):
    client.force_authenticate(user=admin_user)

    response = client.get(url, {"search": "PCR-META-001"})
    assert response.status_code == 200
    assert [row["project_metacode"] for row in _results(response)] == ["PCR-META-001"]

    response = client.get(url, {"search": "Beta Completion"})
    assert response.status_code == 200
    assert [row["project_metacode"] for row in _results(response)] == ["PCR-META-002"]


def test_pcr_project_submission_date_range(client, url, admin_user, pcr_listing_data):
    client.force_authenticate(user=admin_user)

    response = client.get(url, {"submission_date_after": "2026-06-01"})
    assert response.status_code == 200
    assert [row["project_metacode"] for row in _results(response)] == ["PCR-META-002"]

    response = client.get(
        url,
        {
            "submission_date_after": "2026-05-01",
            "submission_date_before": "2026-05-31",
        },
    )
    assert response.status_code == 200
    assert [row["project_metacode"] for row in _results(response)] == ["PCR-META-001"]


def test_pcr_project_list_filters_are_scoped_to_pcr_queryset(
    client, admin_user, pcr_listing_data
):
    client.force_authenticate(user=admin_user)
    unused_country = CountryFactory.create(name="PCR Country Without PCR")
    ProjectFactory.create(country=unused_country, metacode="PCR-META-UNUSED")

    response = client.get(reverse("project-completion-report-list-filters"))

    assert response.status_code == 200
    assert {country["name"] for country in response.data["country"]} == {
        "PCR Country A",
        "PCR Country B",
    }
    assert "PCR Country Without PCR" not in {
        country["name"] for country in response.data["country"]
    }
    assert response.data["region"] == [
        {"id": pcr_listing_data["region_a"].id, "name": "PCR Region A"},
        {"id": pcr_listing_data["project_b"].country.parent_id, "name": "PCR Region B"},
    ]
    assert response.data["cooperating_agency"] == [
        {"id": pcr_listing_data["coop_agency_a"].id, "name": "PCR Coop Agency A"}
    ]
    assert {option["name"] for option in response.data["pcr_due"]} == {"Yes", "No"}
