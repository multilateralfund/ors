import factory.fuzzy
from core.models.country import Country
from core.models.country_programme import CountryProgrammeReport

from core.models.group import Group
from core.models.substance import Substance
from core.models.usage import ExcludedUsage, Usage
from core.models.blend import Blend
from core.models.user import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Faker("last_name")
    email = factory.Faker("email")
    password = factory.Faker(
        "password",
        length=10,
        special_chars=True,
        digits=True,
        upper_case=True,
        lower_case=True,
    )


class UsageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Usage

    name = factory.Faker("pystr", max_chars=100)
    full_name = factory.Faker("pystr", max_chars=248)
    description = factory.Faker("pystr", max_chars=248)
    sort_order = factory.Faker("random_int", min=1, max=100)


class GroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Group

    name = factory.Faker("pystr", max_chars=100)
    name_alt = factory.Faker("pystr", max_chars=100)
    description = factory.Faker("pystr", max_chars=100)


class SubstanceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Substance

    name = factory.Faker("pystr", max_chars=100)
    formula = factory.Faker("pystr", max_chars=100)
    odp = factory.Faker("random_int", min=1, max=100)
    min_odp = factory.Faker("random_int", min=1, max=100)
    max_odp = factory.Faker("random_int", min=1, max=100)
    is_contained_in_polyols = factory.Faker("pybool")
    is_captured = factory.Faker("pybool")
    sort_order = factory.Faker("random_int", min=1, max=100)


class BlendFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Blend

    name = factory.Faker("pystr", max_chars=64)
    other_names = factory.Faker("pystr", max_chars=100)
    odp = factory.Faker("random_int", min=1, max=100)
    gwp = factory.Faker("random_int", min=1, max=100)
    sort_order = factory.Faker("random_int", min=1, max=100)


class ExcludedUsageSubstFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExcludedUsage

    usage = factory.SubFactory(UsageFactory)
    substance = factory.SubFactory(SubstanceFactory)


class ExcludedUsageBlendFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExcludedUsage

    usage = factory.SubFactory(UsageFactory)
    blend = factory.SubFactory(BlendFactory)


class CountryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Country

    name = factory.Faker("pystr", max_chars=50)
    abbr = factory.Faker("pystr", max_chars=5)


# country_programme_report factory
class CountryProgrammeReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CountryProgrammeReport

    country = factory.SubFactory(CountryFactory)
    name = factory.Faker("pystr", max_chars=100)
    year = factory.Faker("random_int", min=1995, max=2030)
