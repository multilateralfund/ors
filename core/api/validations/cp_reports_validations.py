import math

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


def validate_cp_report(attrs):
    validate_section_a(attrs.get("section_a"))
    validate_section_b(attrs.get("section_b"))
    validate_section_c(attrs.get("section_c"))
    validate_section_d(
        attrs.get("section_d"),
        attrs.get("section_a"),
        attrs.get("section_b"),
        attrs.get("section_e"),
    )
    validate_section_e(attrs.get("section_e"), attrs.get("section_d"))
    validate_section_f(attrs.get("section_f"))


def validate_section_a(values):
    if not values:
        return


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
    for row in section_a_values:
        if row.get("substance_id") and row.get("production", 0) > 0:
            hfc_substances_produced = True
            break

    for row in section_b_values:
        if row.get("substance_id") and row.get("production", 0) > 0:
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
        not math.isclose(
            values[0].get("all_uses", 0), sum_all_uses, abs_tol=abs_tol
        )
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
