import importlib

import pytest
from django.apps import apps as django_apps

from core.admin.project_pcr_exclusion import ProjectPCRRequiredExclusionRuleAdminForm
from core.api.tests.factories import (
    ProjectClusterFactory,
    ProjectFactory,
    ProjectSectorFactory,
    ProjectTypeFactory,
)
from core.models.project import Project
from core.models.project_pcr_exclusion import ProjectPCRRequiredExclusionRule


pytestmark = pytest.mark.django_db


def create_rule(name, types=None, clusters=None, sectors=None, is_active=True):
    rule = ProjectPCRRequiredExclusionRule.objects.create(
        name=name,
        is_active=is_active,
    )
    if types:
        rule.types.set(types)
    if clusters:
        rule.clusters.set(clusters)
    if sectors:
        rule.sectors.set(sectors)
    return rule


def pcr_required_ids():
    return set(Project.objects.pcr_required().values_list("id", flat=True))


def test_pcr_required_excludes_any_selected_type():
    excluded_type_1 = ProjectTypeFactory.create(code="INS")
    excluded_type_2 = ProjectTypeFactory.create(code="PS")
    included_type = ProjectTypeFactory.create(code="INV")

    excluded_project_1 = ProjectFactory.create(project_type=excluded_type_1)
    excluded_project_2 = ProjectFactory.create(project_type=excluded_type_2)
    included_project = ProjectFactory.create(project_type=included_type)

    create_rule(
        "Types not PCR required",
        types=[excluded_type_1, excluded_type_2],
    )

    assert pcr_required_ids() == {included_project.id}
    assert excluded_project_1.id not in pcr_required_ids()
    assert excluded_project_2.id not in pcr_required_ids()


def test_pcr_required_excludes_sector_only_rule():
    excluded_sector = ProjectSectorFactory.create(code="ENA")
    included_sector = ProjectSectorFactory.create(code="SOL")

    excluded_project = ProjectFactory.create(sector=excluded_sector)
    included_project = ProjectFactory.create(sector=included_sector)

    create_rule("Enabling activities not PCR required", sectors=[excluded_sector])

    assert pcr_required_ids() == {included_project.id}
    assert excluded_project.id not in pcr_required_ids()


def test_pcr_required_excludes_sector_and_any_selected_cluster():
    sector = ProjectSectorFactory.create(code="VER")
    other_sector = ProjectSectorFactory.create(code="SOL")
    excluded_cluster_1 = ProjectClusterFactory.create(code="HPMP1")
    excluded_cluster_2 = ProjectClusterFactory.create(code="KIP1")
    included_cluster = ProjectClusterFactory.create(code="KPP1")

    excluded_project_1 = ProjectFactory.create(
        sector=sector,
        cluster=excluded_cluster_1,
    )
    excluded_project_2 = ProjectFactory.create(
        sector=sector,
        cluster=excluded_cluster_2,
    )
    included_wrong_cluster = ProjectFactory.create(
        sector=sector,
        cluster=included_cluster,
    )
    included_wrong_sector = ProjectFactory.create(
        sector=other_sector,
        cluster=excluded_cluster_1,
    )

    create_rule(
        "Verification HPMP/KIP not PCR required",
        clusters=[excluded_cluster_1, excluded_cluster_2],
        sectors=[sector],
    )

    assert pcr_required_ids() == {
        included_wrong_cluster.id,
        included_wrong_sector.id,
    }
    assert excluded_project_1.id not in pcr_required_ids()
    assert excluded_project_2.id not in pcr_required_ids()


def test_pcr_required_ignores_inactive_rules():
    project_type = ProjectTypeFactory.create(code="INS")
    project = ProjectFactory.create(project_type=project_type)

    create_rule("Inactive rule", types=[project_type], is_active=False)

    assert pcr_required_ids() == {project.id}


def test_pcr_required_without_rules_returns_original_queryset():
    project_1 = ProjectFactory.create()
    project_2 = ProjectFactory.create()

    assert pcr_required_ids() == {project_1.id, project_2.id}


def test_admin_form_rejects_empty_rule():
    form = ProjectPCRRequiredExclusionRuleAdminForm(
        data={
            "name": "Empty rule",
            "is_active": "on",
            "types": [],
            "clusters": [],
            "sectors": [],
        }
    )

    assert not form.is_valid()
    assert "Select at least one type, cluster, or sector." in form.errors["__all__"]


def test_admin_form_rejects_duplicate_rule_combinations():
    project_type = ProjectTypeFactory.create(code="INS")
    sector = ProjectSectorFactory.create(code="ENA")
    create_rule("Existing rule", types=[project_type], sectors=[sector])

    form = ProjectPCRRequiredExclusionRuleAdminForm(
        data={
            "name": "Duplicate rule",
            "is_active": "on",
            "types": [str(project_type.id)],
            "clusters": [],
            "sectors": [str(sector.id)],
        }
    )

    assert not form.is_valid()
    assert (
        "A PCR required exclusion rule with the same type, cluster, and sector "
        "selections already exists."
    ) in form.errors["__all__"]


def test_seed_migration_creates_expected_rules():
    migration = importlib.import_module(
        "core.migrations.0306_seed_project_pcr_exclusion_rules"
    )

    ins_type = ProjectTypeFactory.create(code="INS")
    ps_type = ProjectTypeFactory.create(code="PS")
    prp_type = ProjectTypeFactory.create(code="PRP")
    enabling_sector = ProjectSectorFactory.create(code="ENA")
    verification_sector = ProjectSectorFactory.create(code="VER")
    clusters = [
        ProjectClusterFactory.create(code=code)
        for code in ("HPMP1", "HPMP2", "HPMP3", "HPMP4", "KIP1", "KIP2", "KIP3")
    ]

    migration.seed_project_pcr_exclusion_rules(django_apps, None)

    type_rule = ProjectPCRRequiredExclusionRule.objects.get(
        name="Types not PCR required"
    )
    assert set(type_rule.types.all()) == {ins_type, ps_type, prp_type}
    assert not type_rule.clusters.exists()
    assert not type_rule.sectors.exists()

    sector_rule = ProjectPCRRequiredExclusionRule.objects.get(
        name="Enabling activities not PCR required"
    )
    assert set(sector_rule.sectors.all()) == {enabling_sector}
    assert not sector_rule.types.exists()
    assert not sector_rule.clusters.exists()

    verification_rule = ProjectPCRRequiredExclusionRule.objects.get(
        name="Verification HPMP/KIP not PCR required"
    )
    assert set(verification_rule.sectors.all()) == {verification_sector}
    assert set(verification_rule.clusters.all()) == set(clusters)
    assert not verification_rule.types.exists()
