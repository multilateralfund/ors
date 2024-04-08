import math

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError
from rest_framework import serializers

from core.models.substance import Substance


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
        error_list.append(
            {
                "row_id": row_id,
                "errors": errors
            }
        )
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
    # validate usages_sum
    for record in section_records:
        row_id = record.get("row_id")
        try:
            validate_quantity_sum(record)
        except ValidationError as e:
            error_dict[row_id]= {
                    "imports": e.detail,
                    "export": e.detail,
                    "production": e.detail,
                }
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
