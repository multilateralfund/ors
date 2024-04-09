from collections import defaultdict

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

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
        return []
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


def validate_section_b(section_records):
    if not section_records:
        return []


def validate_section_c(section_records):
    if not section_records:
        return []

    error_dict = {}
    for row in section_records:
        remarks = row.get("remarks", "").lower()
        if not any(price_type in remarks for price_type in ["fob", "retail"]):
            row_id = row.get("row_id")
            error_dict[row_id] = {
                "remarks": ValidationError(
                    _("Indicate whether the prices are FOB or retail prices.")
                ).detail,
            }

    error_list = format_error_dict(error_dict)
    return error_list


def check_hfc_produced(section_a_records, section_b_records):
    section_a_substances = [
        row["substance_id"] for row in section_a_records if row.get("substance_id")
    ]
    annex_c_substances = Substance.objects.filter(
        id__in=section_a_substances, group__name="C/I"
    ).values_list("id", flat=True)
    for row in section_a_records:
        if row.get("substance_id") in annex_c_substances and row.get("production"):
            return True

    section_b_substances = [
        row["substance_id"] for row in section_b_records if row.get("substance_id")
    ]
    annex_f_substances = Substance.objects.filter(
        id__in=section_b_substances, group__name="F"
    ).values_list("id", flat=True)
    for row in section_b_records:
        if row.get("substance_id") in annex_f_substances and row.get("production"):
            return True

    return False


def check_section_d_filled(row):
    all_uses = row.get("all_uses")
    feedstock_gc = row.get("feedstock_gc")
    destruction = row.get("destruction")
    if all_uses or feedstock_gc or destruction:
        return True

    return False


def validate_section_d(
    section_d_records,
    section_a_records,
    section_b_records,
    section_e_records,
):
    if check_section_d_filled(section_d_records[0]):
        hfc_substances_produced = check_hfc_produced(
            section_a_records, section_b_records
        )
        if not hfc_substances_produced:
            return [
                {
                    "row_id": "general_error",
                    "errors": ValidationError(
                        _(
                            "This form should be filled only if the country generated HFC-23 "
                            "from any facility that produced (manufactured) "
                            "HCFC (Annex C – Group I) or HFC (Annex F) substances."
                        )
                    ).detail,
                }
            ]

    sum_all_uses = 0
    sum_feedstock = 0
    sum_destruction = 0
    for row in section_e_records:
        sum_all_uses += row.get("all_uses", 0)
        sum_feedstock += row.get("feedstock_gc", 0)
        sum_destruction += row.get("destruction", 0)

    if sum_all_uses == 0 and sum_feedstock == 0 and sum_destruction == 0:
        return []

    row = section_d_records[0]
    row_id = row.get("row_id")
    error_dict = defaultdict(dict)
    detail = ValidationError(
        _(
            "Total for columns under 'Amount generated and captured' in Section E "
            "should be reported in Section D under the respective column."
        )
    ).detail

    if row.get("all_uses") != sum_all_uses:
        error_dict[row_id]["all_uses"] = detail

    if row.get("feedstock") != sum_feedstock:
        error_dict[row_id]["feedstock"] = detail

    if row.get("destruction") != sum_destruction:
        error_dict[row_id]["destruction"] = detail

    error_list = format_error_dict(error_dict)
    return error_list


def validate_section_e(section_e_records, section_d_records):
    if not check_section_d_filled(section_d_records[0]):
        return []

    error_dict = {}
    detail = (
        ValidationError(
            _("Facility name must be provided if data in Section D is provided.")
        ).detail,
    )

    if not section_e_records:
        error_dict["general_error"] = {"facility": detail}

    for row in section_e_records:
        if not row.get("facility"):
            row_id = row.get("row_id")
            error_dict[row_id] = {"facility": detail}

    error_list = format_error_dict(error_dict)
    return error_list


def validate_section_f(section_records):
    if not section_records:
        return []
