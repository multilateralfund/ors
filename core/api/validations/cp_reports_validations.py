from rest_framework.exceptions import ValidationError


def validate_cp_report(attrs):
    validate_section_a(attrs.get("section_a"))
    validate_section_b(attrs.get("section_b"))
    validate_section_c(attrs.get("section_c"))
    validate_section_d(attrs.get("section_d"))
    validate_section_e(attrs.get("section_e"))
    validate_section_f(attrs.get("section_f"))


def validate_record_usages(record_usages):
    for usage in record_usages:
        if usage.get("quantity", 0) < 0:
            raise ValidationError("Negative use data cannot be submitted")


def validate_section_a(values):
    if not values:
        return

    for row in values:
        validate_record_usages(row.get("record_usages", []))


def validate_section_b(values):
    if not values:
        return

    for row in values:
        validate_record_usages(row.get("record_usages", []))


def validate_section_c(values):
    if not values:
        return


def validate_section_d(values):
    if not values:
        return


def validate_section_e(values):
    if not values:
        return


def validate_section_f(values):
    if not values:
        return
