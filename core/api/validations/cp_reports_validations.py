import math

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError
from rest_framework import serializers

from core.models.blend import Blend
from core.models.substance import Substance
from core.models.usage import Usage


def eliminate_used_excluded_usages(section_records):
    """
    Eliminate used and excluded usages from the section records

    @param section_records: list of dict
    @return updated section records
    """
    for record in section_records:
        chemical = get_chemical_for_record(record)
        if not chemical:
            return []
        excluded_usages = chemical.excluded_usages.values_list(
            "usage_id", flat=True
        ).all()
        record["record_usages"] = [
            usage
            for usage in record["record_usages"]
            if usage["usage_id"] not in excluded_usages
        ]
    return section_records


def validate_cp_report(attrs):
    errors = {}
    errors["a"] = validate_section_a(attrs.get("section_a"))
    errors["b"] = validate_section_b(attrs.get("section_b"))
    errors["c"] = validate_section_c(attrs.get("section_c"))
    errors["d"] = validate_section_d(
        attrs.get("section_d"),
        attrs.get("section_a"),
        attrs.get("section_b"),
        attrs.get("section_e"),
    )
    errors["e"] = validate_section_e(attrs.get("section_e"), attrs.get("section_d"))
    errors["f"] = validate_section_f(attrs.get("section_f"))

    errors_dict = {f"section_{key}": value for key, value in errors.items() if value}
    if errors_dict:
        raise ValidationError(errors_dict)

    # eliminate used excluded usages
    attrs["section_a"] = eliminate_used_excluded_usages(attrs.get("section_a"))
    attrs["section_b"] = eliminate_used_excluded_usages(attrs.get("section_b"))
    return attrs


def format_error_dict(error_dict):
    """
    Format error dict to list of errors

    @param error_dict: dict
    structure: {row_id: {column_name: error}}

    @return: list
    structure: [{row_id: row_id, errors: {column_name: error}}]
    """
    error_list = []
    for row_id, errors in error_dict.items():
        error_list.append({"row_id": row_id, "errors": errors})
    return error_list


def validate_quantity_sum(record):
    """
    Check if the usages quantities sum is equal to the import-export+production
    """
    usage_sum = sum([usage["quantity"] for usage in record["record_usages"]])
    import_value = record["imports"] or 0
    export_value = record["exports"] or 0
    production_value = record["production"] or 0
    import_sum = import_value - export_value + production_value
    if usage_sum != import_sum and not record["remarks"]:
        raise ValidationError(
            f"Sum of usages quantities should be equal to the import-export+production. "
            f"Please provide an explanation in the remarks field."
        )


def get_chemical_for_record(record):
    """
    Get chemical for the record

    @param record: dict
    @return: Substance or Blend
    """
    substance_id = record.get("substance_id")
    blend_id = record.get("blend_id")
    if substance_id:
        return Substance.objects.prefetch_related("excluded_usages").get(
            id=substance_id
        )
    if blend_id:
        return Blend.objects.prefetch_related("excluded_usages").get(id=blend_id)
    return None


def validate_section_a(section_records):
    """
    Validate section A records

    @param section_records: list
    @return: list
    structure: [{row_id: row_id, errors: {column_name: error}}]

    """

    if not section_records:
        return
    error_dict = {}

    methil_bromide = Substance.objects.filter(name__icontains="methyl bromide").first()
    methil_bromide_usages = list(
        Usage.objects.filter(full_name__icontains="methyl bromide")
        .values_list("id", flat=True)
        .all()
    )

    # validate usages_sum
    for record in section_records:
        row_id = record.get("row_id")
        try:
            validate_quantity_sum(record)
        except ValidationError as e:
            error_dict[row_id] = {
                "imports": e.detail,
                "export": e.detail,
                "production": e.detail,
            }

        # if any of the 2 cells for "Annex E Group I - Methyl Bromide" <->
        # "Methyl bromide - QPS" or "Methyl bromide - non QPS" are filled in,
        # then the corresponding row has to have text in the column "Remarks"
        if methil_bromide and record.get("substance_id") == methil_bromide.id:
            mb_quantity = sum(
                [
                    usage["quantity"]
                    for usage in record.get("record_usages", [])
                    if usage["usage_id"] in methil_bromide_usages
                ]
            )
            if mb_quantity > 0 and not record.get("remarks"):
                if row_id not in error_dict:
                    error_dict[row_id] = {}
                error_dict[row_id]["remarks"] = ValidationError(
                    _("Please provide an explanation for methyl bromide consumption.")
                ).detail

    error_list = format_error_dict(error_dict)
    return error_list


def validate_section_b(values):
    if not values:
        return


def validate_section_c(values):
    if not values:
        return

    for row in values:
        remarks = row.get("remarks", "").lower()
        if not any(price_type in remarks for price_type in ["fob", "retail"]):
            raise serializers.ValidationError(
                _("Indicate whether the prices are FOB or retail prices.")
            )


def validate_section_d(
    values,
    section_a_values,
    section_b_values,
    section_e_values,
):
    if not values:
        return

    hfc_substances_produced = False
    section_a_substances = [
        row["substance_id"] for row in section_a_values if row.get("substance_id")
    ]
    annex_c_substances = Substance.objects.filter(
        id__in=section_a_substances, group__name="C/I"
    ).values_list("id", flat=True)
    for row in section_a_values:
        if (
            row.get("substance_id") in annex_c_substances
            and row.get("production", 0) > 0
        ):
            hfc_substances_produced = True
            break

    section_b_substances = [
        row["substance_id"] for row in section_b_values if row.get("substance_id")
    ]
    annex_f_substances = Substance.objects.filter(
        id__in=section_b_substances, group__name="F"
    ).values_list("id", flat=True)
    for row in section_b_values:
        if (
            row.get("substance_id") in annex_f_substances
            and row.get("production", 0) > 0
        ):
            hfc_substances_produced = True
            break

    if not hfc_substances_produced:
        raise serializers.ValidationError(
            _(
                "This form should be filled only if the country generated HFC-23"
                " from any facility that produced (manufactured)"
                " HCFC (Annex C – Group I) or HFC (Annex F) substances."
            )
        )

    sum_all_uses = 0
    sum_feedstock = 0
    sum_destruction = 0
    for row in section_e_values:
        sum_all_uses += row.get("all_uses", 0)
        sum_feedstock += row.get("feedstock_gc", 0)
        sum_destruction += row.get("destruction", 0)

    if sum_all_uses == 0 and sum_feedstock == 0 and sum_destruction == 0:
        return

    abs_tol = 0.1
    if (
        not math.isclose(values[0].get("all_uses", 0), sum_all_uses, abs_tol=abs_tol)
        or not math.isclose(
            values[0].get("feedstock", 0), sum_feedstock, abs_tol=abs_tol
        )
        or not math.isclose(
            values[0].get("destruction", 0), sum_destruction, abs_tol=abs_tol
        )
    ):
        raise serializers.ValidationError(
            _(
                "Total for columns under 'Amount generated and captured' in Section E"
                " should be reported in Section D under the respective column."
            )
        )


def validate_section_e(values, section_d_values):
    if not section_d_values:
        return

    if not values:
        raise serializers.ValidationError(
            _("Facility name must be provided if data in Section D is provided.")
        )

    for row in values:
        if not row.get("facility"):
            raise serializers.ValidationError(
                _("Facility name must be provided if data in Section D is provided.")
            )


def validate_section_f(values):
    if not values:
        return
