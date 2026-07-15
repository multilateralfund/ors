from datetime import datetime, timezone as dt_timezone
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import serializers
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
    SubstanceFactory,
)
from core.models.country import Country
from core.models.project import Project
from core.models.project_completion_report import (
    PCR,
    PCRProject,
    PCRProjectEnterprise,
)
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


def _pcr_project_payload(project, **overrides):
    payload = {
        "project_id": project.id,
        "financial_figures_status": PCRProject.FinancialFiguresStatus.FINAL,
        "project_goal_achieved": PCRProject.ProjectGoalAchieved.YES,
        "rating": PCRProject.Rating.SATISFACTORY_PLANNED,
        "completed_by": PCRProject.CompletedBy.LEAD_AGENCY,
    }
    payload.update(overrides)
    return payload


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


def test_pcr_project_create(client, url, admin_user):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    substance_from = SubstanceFactory.create()
    substance_to = SubstanceFactory.create()
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {
            "meta_project_id": meta_project.id,
            "submission_date": "2026-07-10",
            "pcr_projects": [
                _pcr_project_payload(
                    project,
                    addresses="Test project address",
                    funds_disbursed="12345.67",
                    planned_date_of_completion="2026-06-30",
                    alternative_technologies=[
                        {
                            "substance_from": substance_from.id,
                            "substance_to": substance_to.id,
                        }
                    ],
                    enterprises=[
                        {"name": "Enterprise A", "address": "Test project address"}
                    ],
                    equipments=[
                        {
                            "name": "Equipment A",
                            "description": "Rendered unusable",
                            "disposal_type": 1,
                            "disposal_date": "2026-05-31",
                        }
                    ],
                )
            ],
        },
        format="json",
    )

    assert response.status_code == 201
    pcr = PCR.objects.get(id=response.data["id"])
    pcr_project = PCRProject.objects.get(pcr=pcr, project=project)
    assert str(pcr.submission_date) == "2026-07-10"
    assert pcr_project.addresses == "Test project address"
    assert pcr_project.funds_disbursed == Decimal("12345.670000000000000")
    assert str(pcr_project.planned_date_of_completion) == "2026-06-30"
    assert list(
        pcr_project.alternative_technologies.values(
            "substance_from_id", "substance_to_id"
        )
    ) == [{"substance_from_id": substance_from.id, "substance_to_id": substance_to.id}]
    assert list(pcr_project.enterprises.values("name", "address")) == [
        {"name": "Enterprise A", "address": "Test project address"}
    ]
    assert list(
        pcr_project.equipments.values(
            "name", "description", "disposal_type", "disposal_date"
        )
    ) == [
        {
            "name": "Equipment A",
            "description": "Rendered unusable",
            "disposal_type": 1,
            "disposal_date": datetime(2026, 5, 31).date(),
        }
    ]
    assert (
        pcr_project.financial_figures_status == PCRProject.FinancialFiguresStatus.FINAL
    )
    assert response.data["id"] == pcr.id
    assert response.data["meta_project_id"] == meta_project.id
    assert response.data["submission_date"] == "2026-07-10"
    assert response.data["pcr_projects"][0]["id"] == pcr_project.id
    assert response.data["pcr_projects"][0]["project_id"] == project.id
    assert response.data["pcr_projects"][0]["addresses"] == "Test project address"
    assert response.data["pcr_projects"][0]["funds_disbursed"] == (
        "12345.670000000000000"
    )
    assert response.data["pcr_projects"][0]["planned_date_of_completion"] == (
        "2026-06-30"
    )
    assert response.data["pcr_projects"][0]["alternative_technologies"] == [
        {"substance_from": substance_from.id, "substance_to": substance_to.id}
    ]
    assert response.data["pcr_projects"][0]["enterprises"] == [
        {"name": "Enterprise A", "address": "Test project address"}
    ]
    assert response.data["pcr_projects"][0]["equipments"] == [
        {
            "name": "Equipment A",
            "description": "Rendered unusable",
            "disposal_type": 1,
            "disposal_date": "2026-05-31",
        }
    ]


def test_pcr_project_create_with_multiple_projects(client, url, admin_user):
    meta_project = MetaProjectFactory.create()
    projects = ProjectFactory.create_batch(2, meta_project=meta_project)
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {
            "meta_project_id": meta_project.id,
            "pcr_projects": [
                _pcr_project_payload(projects[0], addresses="First project")
            ],
        },
        format="json",
    )

    assert response.status_code == 201
    assert [item["project_id"] for item in response.data["pcr_projects"]] == [
        project.id for project in projects
    ]
    assert PCRProject.objects.filter(pcr_id=response.data["id"]).count() == 2
    assert PCRProject.objects.get(project=projects[0]).addresses == "First project"
    assert PCRProject.objects.get(project=projects[1]).addresses is None


def test_pcr_project_create_rejects_nonexistent_meta_project(client, url, admin_user):
    nonexistent_meta_project_id = 999999
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {"meta_project_id": nonexistent_meta_project_id},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["meta_project_id"] == [
        f'Invalid pk "{nonexistent_meta_project_id}" - object does not exist.'
    ]
    assert PCR.objects.count() == 0


def test_pcr_project_create_rejects_nonexistent_nested_project(client, url, admin_user):
    meta_project = MetaProjectFactory.create()
    nonexistent_project_id = 999999
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {
            "meta_project_id": meta_project.id,
            "pcr_projects": [{"project_id": nonexistent_project_id}],
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["pcr_projects"][0]["project_id"] == [
        f'Invalid pk "{nonexistent_project_id}" - object does not exist.'
    ]
    assert PCR.objects.count() == 0


def test_pcr_project_create_rejects_unrelated_nested_project(client, url, admin_user):
    meta_project = MetaProjectFactory.create()
    unrelated_project = ProjectFactory.create(meta_project=MetaProjectFactory.create())
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {
            "meta_project_id": meta_project.id,
            "pcr_projects": [{"project_id": unrelated_project.id}],
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["pcr_projects"] == [
        "Projects do not belong to this PCR's MetaProject: " f"{unrelated_project.id}."
    ]
    assert PCR.objects.count() == 0


def test_pcr_project_create_rejects_duplicate_nested_projects(client, url, admin_user):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {
            "meta_project_id": meta_project.id,
            "pcr_projects": [
                {"project_id": project.id},
                {"project_id": project.id},
            ],
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["pcr_projects"] == [
        f"Duplicate Project IDs are not allowed: {project.id}."
    ]
    assert PCR.objects.count() == 0


def test_pcr_project_create_rejects_project_already_assigned_to_pcr(
    client, url, admin_user
):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    existing_pcr = PCR.objects.create(meta_project=meta_project)
    PCRProject.objects.create(pcr=existing_pcr, project=project)
    client.force_authenticate(user=admin_user)

    response = client.post(
        url,
        {"meta_project_id": meta_project.id},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["meta_project_id"] == [
        f"MetaProject has Projects already assigned to a PCR: {project.id}."
    ]
    assert PCR.objects.count() == 1
    assert PCRProject.objects.count() == 1


def test_pcr_project_create_rolls_back_when_nested_creation_fails(
    client, url, admin_user
):
    meta_project = MetaProjectFactory.create()
    ProjectFactory.create_batch(2, meta_project=meta_project)
    client.force_authenticate(user=admin_user)
    actual_create = PCRProject.objects.create
    call_count = 0

    def create_then_fail(**kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 2:
            raise serializers.ValidationError("Nested creation failed.")
        return actual_create(**kwargs)

    with patch.object(PCRProject.objects, "create", side_effect=create_then_fail):
        response = client.post(
            url,
            {"meta_project_id": meta_project.id},
            format="json",
        )

    assert response.status_code == 400
    assert PCR.objects.count() == 0
    assert PCRProject.objects.count() == 0


def test_pcr_project_create_permissions(client, url, user, admin_user):
    meta_project = MetaProjectFactory.create()
    ProjectFactory.create(meta_project=meta_project)
    payload = {"meta_project_id": meta_project.id}

    response = client.post(url, payload, format="json")
    assert response.status_code == 403

    client.force_authenticate(user=user)
    response = client.post(url, payload, format="json")
    assert response.status_code == 403

    client.force_authenticate(user=admin_user)
    response = client.post(url, payload, format="json")
    assert response.status_code == 201


def test_pcr_retrieve(client, admin_user):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    pcr = PCR.objects.create(meta_project=meta_project, submission_date="2026-07-10")
    pcr_project = PCRProject.objects.create(
        pcr=pcr,
        project=project,
        funds_disbursed="123.45",
        planned_date_of_completion="2026-06-30",
    )
    substance_from = SubstanceFactory.create()
    substance_to = SubstanceFactory.create()
    pcr_project.alternative_technologies.create(
        substance_from=substance_from,
        substance_to=substance_to,
    )
    pcr_project.enterprises.create(
        name="Retrieve enterprise",
        address="Retrieve address",
    )
    pcr_project.equipments.create(
        name="Retrieve equipment",
        description="Retrieve description",
        disposal_type=1,
        disposal_date="2026-05-31",
    )
    client.force_authenticate(user=admin_user)

    response = client.get(reverse("project-completion-report-detail", args=[pcr.id]))

    assert response.status_code == 200
    assert response.data["id"] == pcr.id
    assert response.data["meta_project_id"] == meta_project.id
    assert response.data["submission_date"] == "2026-07-10"
    assert response.data["pcr_projects"][0]["project_id"] == project.id
    assert response.data["pcr_projects"][0]["funds_disbursed"] == (
        "123.450000000000000"
    )
    assert response.data["pcr_projects"][0]["planned_date_of_completion"] == (
        "2026-06-30"
    )
    assert response.data["pcr_projects"][0]["alternative_technologies"] == [
        {"substance_from": substance_from.id, "substance_to": substance_to.id}
    ]
    assert response.data["pcr_projects"][0]["enterprises"] == [
        {"name": "Retrieve enterprise", "address": "Retrieve address"}
    ]
    assert response.data["pcr_projects"][0]["equipments"] == [
        {
            "name": "Retrieve equipment",
            "description": "Retrieve description",
            "disposal_type": 1,
            "disposal_date": "2026-05-31",
        }
    ]


@pytest.mark.parametrize("method", ["patch", "put"])
def test_pcr_update_submission_date_and_nested_project(client, admin_user, method):
    meta_project = MetaProjectFactory.create()
    projects = ProjectFactory.create_batch(2, meta_project=meta_project)
    pcr = PCR.objects.create(meta_project=meta_project)
    pcr_projects = [
        PCRProject.objects.create(pcr=pcr, project=project) for project in projects
    ]
    existing_enterprise = PCRProjectEnterprise.objects.create(
        pcr_project=pcr_projects[0],
        name="Existing enterprise",
        address="Existing address",
    )
    substance_from = SubstanceFactory.create()
    substance_to = SubstanceFactory.create()
    detail_url = reverse("project-completion-report-detail", args=[pcr.id])
    client.force_authenticate(user=admin_user)

    response = getattr(client, method)(
        detail_url,
        {
            "submission_date": "2026-07-10",
            "pcr_projects": [
                _pcr_project_payload(
                    projects[0],
                    addresses="Updated address",
                    funds_disbursed="9876.54",
                    planned_date_of_completion="2026-08-31",
                    alternative_technologies=[
                        {
                            "substance_from": substance_from.id,
                            "substance_to": substance_to.id,
                        }
                    ],
                    enterprises=[
                        {"name": "Updated enterprise", "address": "Updated address"}
                    ],
                    equipments=[
                        {
                            "name": "Updated equipment",
                            "description": "Disposed",
                            "disposal_type": 2,
                            "disposal_date": "2026-09-30",
                        }
                    ],
                )
            ],
        },
        format="json",
    )

    assert response.status_code == 200
    pcr.refresh_from_db()
    for pcr_project in pcr_projects:
        pcr_project.refresh_from_db()
    assert str(pcr.submission_date) == "2026-07-10"
    assert pcr_projects[0].addresses == "Updated address"
    assert pcr_projects[0].funds_disbursed == Decimal("9876.540000000000000")
    assert str(pcr_projects[0].planned_date_of_completion) == "2026-08-31"
    assert not PCRProjectEnterprise.objects.filter(id=existing_enterprise.id).exists()
    assert list(
        pcr_projects[0].alternative_technologies.values(
            "substance_from_id", "substance_to_id"
        )
    ) == [{"substance_from_id": substance_from.id, "substance_to_id": substance_to.id}]
    assert list(pcr_projects[0].enterprises.values("name", "address")) == [
        {"name": "Updated enterprise", "address": "Updated address"}
    ]
    assert list(
        pcr_projects[0].equipments.values(
            "name", "description", "disposal_type", "disposal_date"
        )
    ) == [
        {
            "name": "Updated equipment",
            "description": "Disposed",
            "disposal_type": 2,
            "disposal_date": datetime(2026, 9, 30).date(),
        }
    ]
    assert pcr_projects[1].addresses is None
    assert pcr_projects[1].alternative_technologies.count() == 0
    assert response.data["id"] == pcr.id
    assert response.data["submission_date"] == "2026-07-10"
    assert response.data["pcr_projects"][0]["addresses"] == "Updated address"
    assert response.data["pcr_projects"][0]["funds_disbursed"] == (
        "9876.540000000000000"
    )


def test_pcr_update_rejects_unrelated_nested_project(client, admin_user):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    unrelated_project = ProjectFactory.create(meta_project=MetaProjectFactory.create())
    pcr = PCR.objects.create(meta_project=meta_project)
    PCRProject.objects.create(pcr=pcr, project=project)
    detail_url = reverse("project-completion-report-detail", args=[pcr.id])
    client.force_authenticate(user=admin_user)

    response = client.patch(
        detail_url,
        {"pcr_projects": [{"project_id": unrelated_project.id}]},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["pcr_projects"] == [
        "Projects do not belong to this PCR's MetaProject: " f"{unrelated_project.id}."
    ]


def test_pcr_update_rolls_back_parent_and_nested_projects(client, admin_user):
    meta_project = MetaProjectFactory.create()
    projects = ProjectFactory.create_batch(2, meta_project=meta_project)
    pcr = PCR.objects.create(meta_project=meta_project)
    pcr_projects = [
        PCRProject.objects.create(pcr=pcr, project=project) for project in projects
    ]
    detail_url = reverse("project-completion-report-detail", args=[pcr.id])
    client.force_authenticate(user=admin_user)
    actual_save = PCRProject.save
    call_count = 0

    def save_then_fail(instance, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 2:
            raise serializers.ValidationError("Nested update failed.")
        return actual_save(instance, *args, **kwargs)

    with patch.object(PCRProject, "save", new=save_then_fail):
        response = client.patch(
            detail_url,
            {
                "submission_date": "2026-07-10",
                "pcr_projects": [
                    {"project_id": project.id, "addresses": f"Address {project.id}"}
                    for project in projects
                ],
            },
            format="json",
        )

    assert response.status_code == 400
    pcr.refresh_from_db()
    for pcr_project in pcr_projects:
        pcr_project.refresh_from_db()
    assert pcr.submission_date is None
    assert [pcr_project.addresses for pcr_project in pcr_projects] == [None, None]


def test_pcr_update_nonexistent_pcr(client, admin_user):
    client.force_authenticate(user=admin_user)
    detail_url = reverse("project-completion-report-detail", args=[999999])

    response = client.patch(
        detail_url,
        {"submission_date": "2026-07-10"},
        format="json",
    )

    assert response.status_code == 404


def test_pcr_update_permissions(client, user, admin_user):
    meta_project = MetaProjectFactory.create()
    pcr = PCR.objects.create(meta_project=meta_project)
    detail_url = reverse("project-completion-report-detail", args=[pcr.id])
    payload = {"submission_date": "2026-07-10"}

    response = client.patch(detail_url, payload, format="json")
    assert response.status_code == 403

    client.force_authenticate(user=user)
    response = client.patch(detail_url, payload, format="json")
    assert response.status_code == 403

    client.force_authenticate(user=admin_user)
    response = client.patch(detail_url, payload, format="json")
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
