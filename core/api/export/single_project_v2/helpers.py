import datetime
import logging
from decimal import Decimal
from decimal import InvalidOperation
from typing import Union

from rest_framework import serializers

from core.api.export.base import HeaderType
from core.api.serializers.business_plan import BPActivityExportSerializer
from core.models import BPActivity

logger = logging.getLogger(__name__)


def format_iso_date(isodate=None):
    if isodate:
        if isinstance(isodate, str):
            date = datetime.datetime.fromisoformat(isodate)
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

    if not value:
        return "Yes"

    if value:
        return "No"

    return ""


def field_value(data, header):
    name = header["id"]
    field_data = data["field_data"]
    value = field_data.get(name, {}).get("value")
    return f"{value}" if value else "-"


def field_value_or_computed(data, header, is_date=False, formatter=None):
    name = header["id"]

    field_data = data["field_data"]
    computed_field_data = data["computed_field_data"]

    value = field_data.get(name, {}).get("value")

    is_computed = False

    if value is None:
        value = computed_field_data.get(name, None)
        is_computed = True

    if value and is_date:
        value = format_iso_date(value)

    if value and formatter:
        value = formatter(value)
    elif not value:
        value = "-"

    if is_computed:
        value = f"{value} (computed)"

    return value


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
            value = "/".join(data.get("substances", []))
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
