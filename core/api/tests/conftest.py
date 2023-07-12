# pylint: disable=W0621
import pytest

from core.api.tests.factories import (
    BlendFactory,
    CPReportFactory,
    CountryFactory,
    ExcludedUsageBlendFactory,
    ExcludedUsageSubstFactory,
    GroupFactory,
    SubstanceFactory,
    UsageFactory,
    UserFactory,
)


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def country_ro():
    return CountryFactory.create(name="Romania")


@pytest.fixture
def cp_report_2005(country_ro):
    return CPReportFactory.create(
        country=country_ro, year=2005, comment="Si daca e rau, tot e bine"
    )


@pytest.fixture
def cp_report_2019(country_ro):
    return CPReportFactory.create(
        country=country_ro, year=2019, comment="Daca ploua nu ma ploua"
    )


@pytest.fixture
def usage():
    return UsageFactory.create(name="usage")


@pytest.fixture
def excluded_usage():
    return UsageFactory.create(name="excluded_usage")


@pytest.fixture
def groupA():
    return GroupFactory.create(name="group A", annex="A")


@pytest.fixture
def substance(excluded_usage, groupA):
    substance = SubstanceFactory.create(
        name="substance",
        group=groupA,
        odp=0.02,
        gwp=0.05,
    )
    ExcludedUsageSubstFactory.create(
        substance=substance,
        usage=excluded_usage,
        start_year=1990,
        end_year=3000,
    )
    return substance


@pytest.fixture
def blend(excluded_usage):
    blend = BlendFactory.create(name="blend")
    ExcludedUsageBlendFactory.create(
        blend=blend,
        usage=excluded_usage,
        start_year=1990,
        end_year=3000,
    )
    return blend
