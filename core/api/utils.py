from django.db.models import Exists
from django.db.models import OuterRef
from django_filters import rest_framework as filters

SECTION_ANNEX_MAPPING = {
    "A": ["A", "B", "C", "D", "E"],
    "B": ["F"],
    "C": ["C", "E", "F", "unknown"],
}

SUBMISSION_STATUSE_CODES = ["NEWSUB", "UNK"]


class RelatedExistsFilter(filters.BooleanFilter):
    """Filter query based on whether it has at least one row in the specified related field."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            "help_text",
            (
                f"If true list only entries that have at least one related {kwargs['field_name']}; "
                f"if false list entries without any related rows."
            ),
        )
        super().__init__(*args, **kwargs)

    def filter(self, qs, value):
        if value is None:
            return qs

        # The relationship between the two models used for filtering
        rel = getattr(qs.model, self.field_name).rel
        # The related model
        related_model = rel.related_model
        # Related field pk usually "id"
        related_field_ref = rel.field_name
        # The name of the FK in the related model, used for filtering
        related_field_name = rel.field.name

        subquery = Exists(
            related_model.objects.filter(
                **{related_field_name: OuterRef(related_field_ref)}
            )
        )
        if value:
            return qs.filter(subquery)
        return qs.exclude(subquery)
