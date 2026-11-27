"""
The impact indicators of a PCR (`PCR.impact_indicators`).

The indicators are the actual Impact fields of the PCR projects. The fields
differ by the cluster, type and sector of each project (`ProjectSpecificFields`),
so a PCR gets the union of the fields of all its projects.

The list is built once, when the PCR is created, and is not refreshed later: the
PCR closes the projects it starts with. Only the actual values are reported in
the PCR:
- the numeric indicators are the sum over the projects and can't be changed
  (except the ratios, see NOT_PREFILLED_FIELDS)
- the boolean indicators are prefilled with the union over the projects (any
  "yes" is "yes", otherwise any "no" is "no") and can be changed by the user

Each indicator keeps the value prefilled from the projects (`prefilled_value`),
so the API can tell whether the user changed it.

Stored entry:
    {
        "field": "total_number_of_technicians_trained_actual",
        "label": "Total number of technicians trained - actual",
        "data_type": "number",
        "value": 35,
        "prefilled_value": 38,
    }
"""

from decimal import Decimal, InvalidOperation

from django.db.models import Q

from core.models.project_metadata import ProjectField, ProjectSpecificFields

NUMBER = "number"
DECIMAL = "decimal"
BOOLEAN = "boolean"
DATA_TYPES = (NUMBER, DECIMAL, BOOLEAN)

# Ratios, the sum over the projects is meaningless. These are not prefilled and
# are filled in by the user, unlike the other numeric indicators.
# TODO: the client will decide how these should be computed (e.g. as a weighted
# average), or if they are removed from the PCR.
NOT_PREFILLED_FIELDS = {
    "cost_effectiveness_actual",
    "cost_effectiveness_co2_actual",
    "hfc_23_by_product_generation_rate_actual",
}


def get_impact_indicator_fields(projects):
    """
    The actual Impact fields of the projects, ordered as in the project form.
    """
    combinations = {
        (project.cluster_id, project.project_type_id, project.sector_id)
        for project in projects
    }
    if not combinations:
        return []
    combinations_q = Q()
    for cluster_id, type_id, sector_id in combinations:
        combinations_q |= Q(cluster_id=cluster_id, type_id=type_id, sector_id=sector_id)
    # The obsolete mappings are still used by the legacy projects
    specific_fields = ProjectSpecificFields.objects.with_obsolete().filter(
        combinations_q
    )
    return list(
        ProjectField.objects.filter(
            project_specific_fields__in=specific_fields,
            section="Impact",
            is_actual=True,
            table="project",
            data_type__in=DATA_TYPES,
        )
        .distinct()
        .order_by("sort_order", "id")
    )


def _to_json_number(value, data_type):
    if value is None:
        return None
    if data_type == NUMBER:
        return int(value)
    return float(value)


def is_editable_indicator(indicator):
    """Whether the user can change the value of the indicator"""
    return (
        indicator["data_type"] == BOOLEAN or indicator["field"] in NOT_PREFILLED_FIELDS
    )


def _get_prefilled_value(field, projects):
    """
    The value of the field over the projects: the sum of the numeric fields, the
    union of the boolean ones. None if no project has a value.
    """
    if field.read_field_name in NOT_PREFILLED_FIELDS:
        return None
    values = [
        getattr(project, field.read_field_name, None)
        for project in projects
        if getattr(project, field.read_field_name, None) is not None
    ]
    if not values:
        return None
    if field.data_type == BOOLEAN:
        return any(values)
    return _to_json_number(
        sum(Decimal(str(value)) for value in values), field.data_type
    )


def build_impact_indicators(projects):
    """
    The impact indicators of a new PCR, prefilled from the latest version of its
    projects.
    """
    projects = list(projects)
    indicators = []
    for field in get_impact_indicator_fields(projects):
        prefilled_value = _get_prefilled_value(field, projects)
        indicators.append(
            {
                "field": field.read_field_name,
                "label": field.label,
                "data_type": field.data_type,
                "value": prefilled_value,
                "prefilled_value": prefilled_value,
            }
        )
    return indicators


def represent_impact_indicators(indicators):
    """
    The indicators as returned by the API, with the flags:
    - `editable`: whether the user can change the value
    - `prefilled`: whether the value is still the one prefilled from the projects
    """
    return [
        {
            **indicator,
            "editable": is_editable_indicator(indicator),
            "prefilled": indicator.get("prefilled_value") is not None
            and indicator.get("value") == indicator.get("prefilled_value"),
        }
        for indicator in indicators or []
    ]


def _clean_value(value, data_type):
    """
    The value converted to its JSON type, raises ValueError if it does not match
    the data type of the indicator.
    """
    if value is None or value == "":
        return None
    if data_type == BOOLEAN:
        if not isinstance(value, bool):
            raise ValueError("A boolean value is required.")
        return value
    # bool is a subclass of int
    if isinstance(value, bool):
        raise ValueError("A number is required.")
    try:
        number = Decimal(str(value))
    except InvalidOperation as e:
        raise ValueError("A number is required.") from e
    if not number.is_finite():
        raise ValueError("A number is required.")
    if data_type == NUMBER and number != number.to_integral_value():
        raise ValueError("A whole number is required.")
    return _to_json_number(number, data_type)


def apply_impact_indicator_values(indicators, values):
    """
    Set the values sent by the user on the PCR indicators. Only the values of the
    editable indicators can change, the list of indicators and their prefilled
    values are kept. The values of the other indicators can be sent unchanged
    (e.g. the whole list returned by the API).

    `values` is a list of {"field": ..., "value": ...}; the indicators that are not
    sent keep their value. Returns the new list of indicators and the errors by
    field name.
    """
    indicators = [dict(indicator) for indicator in indicators or []]
    indicators_by_field = {indicator["field"]: indicator for indicator in indicators}
    errors = {}
    seen = set()
    for item in values:
        field_name = item.get("field")
        indicator = indicators_by_field.get(field_name)
        if indicator is None:
            errors[str(field_name)] = ["Not an impact indicator of this PCR."]
            continue
        if field_name in seen:
            errors[field_name] = ["Duplicate impact indicator."]
            continue
        seen.add(field_name)
        try:
            value = _clean_value(item.get("value"), indicator["data_type"])
        except ValueError as e:
            errors[field_name] = [str(e)]
            continue
        if is_editable_indicator(indicator):
            indicator["value"] = value
        elif value != indicator.get("value"):
            errors[field_name] = [
                "This indicator is computed from the projects and can't be changed."
            ]
    return indicators, errors
