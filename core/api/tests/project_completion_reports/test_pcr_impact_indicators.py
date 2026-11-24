import json
from decimal import Decimal

import pytest
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.export.pcr.sections import PCRDocumentBuilder, Table
from core.api.pcr_impact_indicators import build_impact_indicators
from core.api.tests.factories import (
    MetaProjectFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectFieldFactory,
    ProjectSpecificFieldsFactory,
)
from core.api.tests.project_completion_reports.utils import fill_pcr_required_data
from core.api.views.project_completion_report.pcr_validation import (
    SUBMIT_REQUIRED_MESSAGE,
    get_pcr_submission_errors,
)
from core.models.project_completion_report import PCR, PCRProject

# pylint: disable=unused-argument,redefined-outer-name

pytestmark = pytest.mark.django_db

CREATE_URL = reverse("project-completion-report-list")
DEFAULTS_URL = reverse("project-completion-report-create-defaults")


def _impact_field(
    name, data_type="number", sort_order=1, is_actual=True, section="Impact"
):
    return ProjectFieldFactory.create(
        import_name=name,
        label=name.replace("_", " "),
        read_field_name=name,
        write_field_name=name,
        table="project",
        data_type=data_type,
        section=section,
        is_actual=is_actual,
        sort_order=sort_order,
    )


def _project(meta_project, specific_fields, status, **values):
    return ProjectFactory.create(
        meta_project=meta_project,
        cluster=specific_fields.cluster,
        project_type=specific_fields.type,
        sector=specific_fields.sector,
        submission_status=status,
        **values,
    )


@pytest.fixture
def client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def fields():
    return {
        "technicians": _impact_field(
            "total_number_of_technicians_trained_actual", sort_order=46
        ),
        "trainers": _impact_field(
            "total_number_of_trainers_trained_actual", sort_order=50
        ),
        "certification": _impact_field(
            "establishment_of_technician_certification_actual",
            data_type="boolean",
            sort_order=62,
        ),
        "energy_savings": _impact_field(
            "energy_savings_actual", data_type="decimal", sort_order=80
        ),
        "cost_effectiveness": _impact_field(
            "cost_effectiveness_actual", data_type="decimal", sort_order=120
        ),
        # Not PCR indicators: a planned value and an actual field of another section
        "planned": _impact_field(
            "total_number_of_technicians_trained", sort_order=45, is_actual=False
        ),
        "other_section": _impact_field(
            "total_number_of_customs_officers_trained_actual",
            sort_order=68,
            section="Cross-Cutting",
        ),
    }


@pytest.fixture
def meta_project_data(fields, project_approved_status):
    """
    A meta project with two projects of different cluster/type/sector, with
    different (overlapping) impact indicators.
    """
    first_fields = ProjectSpecificFieldsFactory.create()
    first_fields.fields.set(
        [
            fields["technicians"],
            fields["certification"],
            fields["cost_effectiveness"],
            fields["planned"],
            fields["other_section"],
        ]
    )
    # The obsolete mappings are still used by the legacy projects
    second_fields = ProjectSpecificFieldsFactory.create(
        cluster=ProjectClusterFactory.create(), obsolete=True
    )
    second_fields.fields.set(
        [fields["technicians"], fields["trainers"], fields["energy_savings"]]
    )
    meta_project = MetaProjectFactory.create()
    first = _project(
        meta_project,
        first_fields,
        project_approved_status,
        total_number_of_technicians_trained_actual=10,
        establishment_of_technician_certification_actual=True,
        cost_effectiveness_actual=Decimal("2.5"),
        total_number_of_customs_officers_trained_actual=7,
    )
    second = _project(
        meta_project,
        second_fields,
        project_approved_status,
        total_number_of_technicians_trained_actual=5,
        energy_savings_actual=Decimal("1.25"),
    )
    # An archived version of the second project, its values are not used
    ProjectFactory.create(
        meta_project=meta_project,
        latest_project=second,
        version=2,
        cluster=second_fields.cluster,
        project_type=second_fields.type,
        sector=second_fields.sector,
        total_number_of_technicians_trained_actual=1000,
    )
    return meta_project, [first, second]


def _create_pcr(client, meta_project, **metadata):
    return client.post(
        CREATE_URL,
        {
            "metadata": json.dumps(
                {"meta_project_id": meta_project.id, **metadata},
                cls=DjangoJSONEncoder,
            ),
            "files": [],
        },
        format="multipart",
    )


def _update_pcr(client, pcr, impact_indicators):
    return client.patch(
        reverse("project-completion-report-detail", args=[pcr.id]),
        {
            "metadata": json.dumps({"impact_indicators": impact_indicators}),
            "files": [],
        },
        format="multipart",
    )


def _by_field(indicators):
    return {indicator["field"]: indicator for indicator in indicators}


class TestBuildImpactIndicators:
    def test_union_of_the_project_fields(self, meta_project_data):
        meta_project, _ = meta_project_data

        indicators = build_impact_indicators(meta_project.projects.for_pcr())

        assert [indicator["field"] for indicator in indicators] == [
            "total_number_of_technicians_trained_actual",
            "total_number_of_trainers_trained_actual",
            "establishment_of_technician_certification_actual",
            "energy_savings_actual",
            "cost_effectiveness_actual",
        ]

    def test_prefilled_values(self, meta_project_data):
        meta_project, _ = meta_project_data

        indicators = _by_field(build_impact_indicators(meta_project.projects.for_pcr()))

        # summed over the latest version of the projects
        assert indicators["total_number_of_technicians_trained_actual"] == {
            "field": "total_number_of_technicians_trained_actual",
            "label": "total number of technicians trained actual",
            "data_type": "number",
            "value": 15,
            "prefilled_value": 15,
        }
        assert indicators["energy_savings_actual"]["prefilled_value"] == 1.25
        # no project has a value
        assert indicators["total_number_of_trainers_trained_actual"]["value"] is None
        # the booleans and the ratios are not prefilled
        for field in [
            "establishment_of_technician_certification_actual",
            "cost_effectiveness_actual",
        ]:
            assert indicators[field]["value"] is None
            assert indicators[field]["prefilled_value"] is None

    def test_pending_projects_are_included(
        self, meta_project_data, project_submitted_status
    ):
        meta_project, projects = meta_project_data
        specific_fields = projects[0].cluster.project_specific_fields.first()
        _project(
            meta_project,
            specific_fields,
            project_submitted_status,
            total_number_of_technicians_trained_actual=3,
        )

        indicators = _by_field(build_impact_indicators(meta_project.projects.for_pcr()))

        assert indicators["total_number_of_technicians_trained_actual"]["value"] == 18

    def test_no_projects(self):
        assert not build_impact_indicators([])


class TestCreate:
    def test_create_defaults(self, client, meta_project_data):
        meta_project, _ = meta_project_data

        response = client.get(DEFAULTS_URL, {"meta_project_id": meta_project.id})

        assert response.status_code == 200
        indicators = _by_field(response.data["impact_indicators"])
        assert len(indicators) == 5
        technicians = indicators["total_number_of_technicians_trained_actual"]
        assert technicians["value"] == 15
        assert technicians["prefilled"] is True
        certification = indicators["establishment_of_technician_certification_actual"]
        assert certification["prefilled"] is False

    def test_create_defaults_of_existing_pcr(self, client, meta_project_data):
        meta_project, _ = meta_project_data
        response = _create_pcr(
            client,
            meta_project,
            impact_indicators=[
                {"field": "total_number_of_technicians_trained_actual", "value": 12}
            ],
        )

        response = client.get(
            DEFAULTS_URL,
            {"meta_project_id": meta_project.id, "pcr_id": response.data["id"]},
        )

        indicators = _by_field(response.data["impact_indicators"])
        technicians = indicators["total_number_of_technicians_trained_actual"]
        assert technicians["value"] == 12
        assert technicians["prefilled_value"] == 15
        assert technicians["prefilled"] is False

    def test_create_builds_the_indicators(self, client, meta_project_data):
        meta_project, _ = meta_project_data

        response = _create_pcr(client, meta_project)

        assert response.status_code == 201
        pcr = PCR.objects.get(id=response.data["id"])
        assert pcr.impact_indicators == build_impact_indicators(
            meta_project.projects.for_pcr()
        )
        assert response.data["impact_indicators"][0]["prefilled"] is True

    def test_create_with_values(self, client, meta_project_data):
        meta_project, _ = meta_project_data

        response = _create_pcr(
            client,
            meta_project,
            impact_indicators=[
                {
                    "field": "total_number_of_technicians_trained_actual",
                    "value": 20,
                    # only the value can be set by the user
                    "prefilled_value": 20,
                    "label": "Changed",
                },
                {
                    "field": "establishment_of_technician_certification_actual",
                    "value": False,
                },
                {"field": "cost_effectiveness_actual", "value": "3.75"},
            ],
        )

        assert response.status_code == 201
        indicators = _by_field(response.data["impact_indicators"])
        technicians = indicators["total_number_of_technicians_trained_actual"]
        assert technicians["value"] == 20
        assert technicians["prefilled_value"] == 15
        assert technicians["label"] == "total number of technicians trained actual"
        assert technicians["prefilled"] is False
        certification = indicators["establishment_of_technician_certification_actual"]
        assert certification["value"] is False
        assert indicators["cost_effectiveness_actual"]["value"] == 3.75
        # not sent, keeps the prefilled value
        assert indicators["energy_savings_actual"]["value"] == 1.25

    @pytest.mark.parametrize(
        "item, error",
        [
            (
                {
                    "field": "total_number_of_customs_officers_trained_actual",
                    "value": 1,
                },
                "Not an impact indicator of this PCR.",
            ),
            (
                {"field": "total_number_of_technicians_trained_actual", "value": "a"},
                "A number is required.",
            ),
            (
                {"field": "total_number_of_technicians_trained_actual", "value": 1.5},
                "A whole number is required.",
            ),
            (
                {"field": "total_number_of_technicians_trained_actual", "value": True},
                "A number is required.",
            ),
            (
                {
                    "field": "establishment_of_technician_certification_actual",
                    "value": 1,
                },
                "A boolean value is required.",
            ),
        ],
    )
    def test_create_rejects_invalid_values(
        self, client, meta_project_data, item, error
    ):
        meta_project, _ = meta_project_data

        response = _create_pcr(client, meta_project, impact_indicators=[item])

        assert response.status_code == 400
        assert response.data["impact_indicators"] == {item["field"]: [error]}
        assert not PCR.objects.filter(meta_project=meta_project).exists()


class TestUpdate:
    @pytest.fixture
    def pcr(self, client, meta_project_data):
        meta_project, _ = meta_project_data
        response = _create_pcr(client, meta_project)
        return PCR.objects.get(id=response.data["id"])

    def test_update_values(self, client, pcr):
        response = _update_pcr(
            client,
            pcr,
            [
                {"field": "total_number_of_trainers_trained_actual", "value": 4},
                {"field": "energy_savings_actual", "value": None},
            ],
        )

        assert response.status_code == 200
        indicators = _by_field(response.data["impact_indicators"])
        assert indicators["total_number_of_trainers_trained_actual"]["value"] == 4
        assert indicators["energy_savings_actual"]["value"] is None
        assert indicators["energy_savings_actual"]["prefilled"] is False
        # not sent, unchanged
        assert indicators["total_number_of_technicians_trained_actual"]["value"] == 15

        # back to the prefilled value
        response = _update_pcr(
            client, pcr, [{"field": "energy_savings_actual", "value": 1.25}]
        )
        indicators = _by_field(response.data["impact_indicators"])
        assert indicators["energy_savings_actual"]["prefilled"] is True

    def test_update_without_indicators_keeps_them(self, client, pcr):
        indicators = pcr.impact_indicators

        response = client.patch(
            reverse("project-completion-report-detail", args=[pcr.id]),
            {"metadata": json.dumps({"addresses": "Address"}), "files": []},
            format="multipart",
        )

        assert response.status_code == 200
        pcr.refresh_from_db()
        assert pcr.impact_indicators == indicators

    def test_indicators_are_fixed_at_creation(
        self, client, pcr, meta_project_data, fields
    ):
        _, projects = meta_project_data
        # the projects change after the PCR is created
        projects[0].total_number_of_technicians_trained_actual = 100
        projects[0].save()
        specific_fields = projects[0].cluster.project_specific_fields.first()
        specific_fields.fields.add(fields["other_section"])
        specific_fields.fields.add(
            _impact_field("number_of_bans_on_equipment_actual", sort_order=76)
        )

        response = _update_pcr(
            client,
            pcr,
            [{"field": "number_of_bans_on_equipment_actual", "value": 1}],
        )

        assert response.status_code == 400
        pcr.refresh_from_db()
        assert len(pcr.impact_indicators) == 5
        technicians = _by_field(pcr.impact_indicators)[
            "total_number_of_technicians_trained_actual"
        ]
        assert technicians["prefilled_value"] == 15

    def test_duplicate_indicator(self, client, pcr):
        field = "total_number_of_trainers_trained_actual"

        response = _update_pcr(
            client,
            pcr,
            [{"field": field, "value": 1}, {"field": field, "value": 2}],
        )

        assert response.status_code == 400
        assert response.data["impact_indicators"] == {
            field: ["Duplicate impact indicator."]
        }

    def test_new_version_copies_the_indicators(self, admin_user, client, pcr):
        _update_pcr(
            client,
            pcr,
            [{"field": "total_number_of_trainers_trained_actual", "value": 4}],
        )
        pcr.refresh_from_db()

        pcr.increase_version(admin_user)

        archived = PCR.objects.really_all().get(latest_pcr=pcr)
        assert archived.impact_indicators == pcr.impact_indicators


class TestSubmitValidation:
    @pytest.fixture
    def pcr(self, meta_project_data):
        meta_project, projects = meta_project_data
        pcr = PCR.objects.create(
            meta_project=meta_project,
            impact_indicators=build_impact_indicators(projects),
        )
        for project in projects:
            PCRProject.objects.create(pcr=pcr, project=project)
        return pcr

    def test_all_indicators_are_required(self, pcr):
        fill_pcr_required_data(pcr)
        assert get_pcr_submission_errors(pcr) == {}

        indicators = pcr.impact_indicators
        indicators[0]["value"] = None
        indicators[2]["value"] = None
        PCR.objects.filter(pk=pcr.pk).update(impact_indicators=indicators)
        pcr.refresh_from_db()

        assert get_pcr_submission_errors(pcr) == {
            "impact_indicators": {
                indicators[0]["field"]: [SUBMIT_REQUIRED_MESSAGE],
                indicators[2]["field"]: [SUBMIT_REQUIRED_MESSAGE],
            }
        }

    def test_false_is_a_value(self, pcr):
        fill_pcr_required_data(pcr)
        indicators = pcr.impact_indicators
        for indicator in indicators:
            if indicator["data_type"] == "boolean":
                indicator["value"] = False
        PCR.objects.filter(pk=pcr.pk).update(impact_indicators=indicators)
        pcr.refresh_from_db()

        assert get_pcr_submission_errors(pcr) == {}

    def test_submit_endpoint(self, client, pcr):
        response = client.post(
            reverse("project-completion-report-submit", args=[pcr.id])
        )

        assert response.status_code == 400
        assert set(response.data["errors"]["impact_indicators"]) == {
            "total_number_of_trainers_trained_actual",
            "establishment_of_technician_certification_actual",
            "cost_effectiveness_actual",
        }


def test_export_overview(meta_project_data):
    meta_project, projects = meta_project_data
    indicators = build_impact_indicators(projects)
    indicators[2]["value"] = True
    pcr = PCR.objects.create(meta_project=meta_project, impact_indicators=indicators)

    blocks = PCRDocumentBuilder(pcr, projects).build_overview()

    table = blocks[1]
    assert isinstance(table, Table)
    assert table.title == "Impact indicators"
    assert table.headers == ["Indicator", "Actual value"]
    assert table.rows == [
        ["total number of technicians trained actual", 15],
        ["total number of trainers trained actual", None],
        ["establishment of technician certification actual", True],
        ["energy savings actual", 1.25],
        ["cost effectiveness actual", None],
    ]
    labels = [label for label, _ in blocks[0].items]
    assert "Number of enterprises" not in labels
    assert "Total number of trainees" not in labels


def test_export_overview_without_indicators(meta_project_data):
    meta_project, projects = meta_project_data
    pcr = PCR.objects.create(meta_project=meta_project)

    blocks = PCRDocumentBuilder(pcr, projects).build_overview()

    # kept, so that the Excel export can match the blocks of all the PCRs
    assert blocks[1].title == "Impact indicators"
    assert not blocks[1].rows
