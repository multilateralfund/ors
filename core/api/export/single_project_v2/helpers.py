import datetime
import logging
import typing
from decimal import Decimal
from decimal import InvalidOperation
from functools import partial
from typing import Union

from rest_framework import serializers

from core.api.export.base import HeaderType
from core.api.serializers.business_plan import BPActivityExportSerializer
from core.models import BPActivity
from core.models import Project

logger = logging.getLogger(__name__)


def format_iso_date(isodate=None):
    if isodate:
        if isinstance(isodate, str):
            try:
                date = datetime.datetime.fromisoformat(isodate)
            except ValueError:
                return ""
        elif isinstance(isodate, (datetime.date, datetime.datetime)):
            date = isodate
        else:
            return ""
        return date.strftime("%d/%m/%Y")
    return ""


def format_dollar_value(value: int | float | str | Decimal):
    if not isinstance(value, Decimal):
        try:
            value = Decimal(value)
        except (TypeError, InvalidOperation):
            return value
    return f"{'-' if value < 0 else ''}${abs(value):,.2f}"


def get_blanket_consideration_value(row: dict, header: HeaderType):
    value: Union[bool, None] = row[header["id"]]
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            return Project.BlanketOrIndividualConsideration(value).label
        except ValueError:
            return value
    return value


def field_value(data, header):
    name = header["id"]
    field_data = data["field_data"]
    return field_data.get(name, {}).get("value")


def value_or_empty_value(value, empty_value=None):
    return {value} if value else empty_value


value_or_dash = partial(value_or_empty_value, empty_value="-")


def get_formatted_field_value(
    data: dict,
    header: HeaderType,
    formatters: list[typing.Callable],
):
    """
    Retrieve value and apply formatter functions in order.

    :param data: the row/data
    :param header: the header definition
    :param formatters: provide formatters as separate arguments, each called with the output value of the previous.
    """
    value = field_value(data, header)
    for fmt in formatters:
        value = fmt(value)
    return value


get_value_or_dash = partial(
    get_formatted_field_value,
    formatters=[value_or_dash],
)

get_dollar_value = partial(
    get_formatted_field_value,
    formatters=[format_dollar_value, value_or_dash],
)

get_date_value = partial(
    get_formatted_field_value,
    formatters=[format_iso_date, value_or_dash],
)


def dict_as_obj(d):
    class Dummy:
        pass

    inst = Dummy()
    for key, value in d.items():
        if isinstance(value, dict):
            setattr(inst, key, dict_as_obj(value))
        else:
            setattr(inst, key, value)

    return inst


def get_activity_data_from_json(data):
    result = {}
    serializer = BPActivityExportSerializer()
    data_as_obj = dict_as_obj(data)
    for field, handler in serializer.get_fields().items():
        if field == "chemical_detail":
            value = "/".join(map(str, data.get("substances", [])))
        elif isinstance(handler, serializers.ChoiceField):
            value = f"{data[field]}"
        elif isinstance(handler, serializers.SlugRelatedField):
            value = data[field][handler.slug_field] if data[field] else None
        elif isinstance(handler, serializers.SerializerMethodField):
            method_field = handler.method_name or f"get_{field}"
            value_getter = getattr(serializer, method_field, lambda x: x)
            value = value_getter(data_as_obj)
        else:
            value = data.get(field, None)
        result[field] = value
    return result


def get_activity_data_from_instance(data):
    result = None
    try:
        activity = BPActivity.objects.get(id=data["bp_activity"]["id"])
        result = BPActivityExportSerializer(activity).data
    except BPActivity.DoesNotExist:
        logger.warning(
            "Linked activity (%s) missing for project %s. Fallback to JSON.",
            data["bp_activity"]["id"],
            data["id"],
        )
    return result


def get_activity_data(data):
    """Serialize Activity if it exists, otherwise use the saved json."""
    result = None

    if data.get("bp_activity"):
        result = get_activity_data_from_instance(data)

    if not result:
        bp_data = data.get("bp_activity_json")
        if bp_data:
            result = get_activity_data_from_json(bp_data)

    return result
