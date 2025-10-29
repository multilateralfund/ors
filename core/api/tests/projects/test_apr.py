import pytest

from core.api.tests.factories import ProjectOdsOdpFactory
from core.models import ProjectOdsOdp


pytestmark = pytest.mark.django_db


class TestProjectPhaseOutData:

    def test_project_phaseout_data(self, project):
        ProjectOdsOdpFactory(
            project=project,
            odp=0.02,
            co2_mt=0.05,
            sort_order=1,
        )
        ProjectOdsOdpFactory(
            project=project,
            odp=0.08,
            co2_mt=0.11,
            sort_order=2,
        )
        ProjectOdsOdpFactory(
            project=project,
            odp=0.14,
            co2_mt=0.17,
            sort_order=3,
            ods_type=ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION,
        )
        ProjectOdsOdpFactory(
            project=project,
            odp=0.2,
            co2_mt=0.23,
            sort_order=4,
            ods_type=ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION,
        )

        assert project.consumption_odp == pytest.approx(0.1)
        assert project.consumption_co2 == pytest.approx(0.16)
        assert project.production_odp == pytest.approx(0.34)
        assert project.production_co2 == pytest.approx(0.4)
