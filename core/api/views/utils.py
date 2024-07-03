from datetime import datetime
from rest_framework.exceptions import ValidationError

from django.db import models
from core.models.business_plan import BusinessPlan
from core.models.country_programme import CPRecord, CPReport, CPReportFormatRow
from core.models.country_programme_archive import CPRecordArchive, CPReportArchive


def get_cp_report_from_request(request, cp_report_class):
    """
    Get country programme report from request query params

    @param request: request object
    @param cp_report_class: country programme report class

    @return: country programme report
    """
    cp_report_id = request.query_params.get("cp_report_id")
    country_id = request.query_params.get("country_id")
    year = request.query_params.get("year")
    cp_report = None

    try:
        user = request.user
        cp_report_qs = cp_report_class.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            cp_report_qs = cp_report_qs.filter(country=user.country)

        if cp_report_id:
            cp_report = cp_report_qs.get(id=cp_report_id)
        elif country_id and year:
            cp_report = cp_report_qs.get(country_id=country_id, year=year)
    except cp_report_class.DoesNotExist as e:
        raise ValidationError({"error": "Country programme report not found"}) from e

    return cp_report


def get_year_params_from_request(request):
    """
    Get min year and max year from request query params
    -> if min year and max year are not provided, set current year for both
    @param request: request object
    @return: min year and max year as integers
    """
    min_year = request.query_params.get("min_year")
    max_year = request.query_params.get("max_year")

    current_year = datetime.now().year
    if not min_year and not max_year:
        # set current year for min year and max year
        min_year = current_year
        max_year = current_year
    if not max_year:
        max_year = current_year
    if not min_year:
        min_year = 1995

    return min_year, max_year


def get_archive_reports_final_for_year(year):
    """
    Get the max version for each archive report that does not have a final report

    @param year: year

    @return: list of archive reports (country_id, max_version)
    """
    countries_list = list(
        CPReport.objects.filter(
            year=year,
            status=CPReport.CPReportStatus.FINAL,
        )
        .values_list("country_id")
        .all()
    )

    # get the max version for each archive report that does not have a final report
    archive_reports = (
        CPReportArchive.objects.filter(
            year=year,
            status=CPReport.CPReportStatus.FINAL,
        )
        .exclude(country_id__in=countries_list)
        .values("country_id")
        .annotate(max_version=models.Max("version"))
        .values_list("country_id", "max_version")
        .all()
    )

    return archive_reports


def get_final_records_for_year(year, filter_list=None):
    """
    Get all the final records for the year with the given filters
     - first get the final records for the countries that have a final report (CPReport)
     - then get the max version for each archive report that does not have a final report
     - get all the records for the archive reports
     - union the final records with the archive records

    @param year: year
    @param filter_list: list of filters to apply to the records

    @return: list of records (CPRecord objects and CPRecordArchive objects)
    """
    if not filter_list:
        filter_list = []

    final_records = CPRecord.objects.get_for_year(year).filter(
        country_programme_report__status=CPReport.CPReportStatus.FINAL,
        *filter_list,
    )

    # get the max version for each archive report that does not have a final report
    archive_reports = get_archive_reports_final_for_year(year)

    if not archive_reports:
        return list(final_records)

    # get all the records for the archive reports
    archive_records = (
        CPRecordArchive.objects.get_for_year(year)
        .filter(
            *filter_list,
        )
        .filter(
            # get the records for the max version of the archive reports
            *[
                models.Q(
                    country_programme_report__version=v,
                    country_programme_report__country_id=c,
                )
                for c, v in archive_reports
            ],
            _connector=models.Q.OR,
        )
    )

    # union the final records with the archive records
    return list(final_records) + list(archive_records)


def set_chemical_items_dict(
    item_cls, existing_items, section, cp_report, append_items=True
):
    """
    Set chemical records dict that are displayed for this report and section

    @param existing_items: list of existing ItemCls objects (CPRecord / CPPrices)
    @param section: str - section name
    @param cp_report: obj - CPReport object
    @param append_items: bool - if True, append new ItemCls objects to the existing items

    @return: dict of chemical records
    structure: {chemical_id: CPRecord object}
    """
    # set existing_items_dict
    existing_items_dict = {}
    for item in existing_items:
        dict_key = (
            f"blend_{item.blend_id}" if item.blend else f"substance_{item.substance_id}"
        )
        existing_items_dict[dict_key] = item

    # get all substances or blends that are displayed in all formats
    displayed_rows = (
        CPReportFormatRow.objects.get_for_year(cp_report.year)
        .filter(section=section)
        .select_related("substance__group", "blend")
        .prefetch_related(
            "substance__excluded_usages",
            "blend__excluded_usages",
            "blend__components",
        )
        .all()
    )

    # add substances or blends that are not in the existing_items_dict yet
    for row in displayed_rows:
        chemical = row.substance or row.blend
        chemical_key = (
            f"blend_{chemical.id}" if row.blend else f"substance_{chemical.id}"
        )
        if append_items and chemical_key not in existing_items_dict:
            cp_record_data = {
                "country_programme_report": cp_report,
                "substance": chemical if row.substance else None,
                "blend": chemical if row.blend else None,
                "id": 0,
            }
            if section in ["A", "B"]:
                cp_record_data["section"] = section
            existing_items_dict[chemical_key] = item_cls(**cp_record_data)

        if chemical_key in existing_items_dict:
            existing_items_dict[chemical_key].sort_order = row.sort_order

    return list(existing_items_dict.values())


def get_displayed_items(
    item_cls, cp_report, section, existing_items, with_sort=True, append_items=True
):
    """
    Returns a list of ItemCls objects for the given section and cp_report_id
    -> if there is no record for a substance or blend that is displayed in all formats
    then append a new ItemCls object to the list with the substance or blend
    and the cp_report_id

    @param item_cls: ItemCls class (CPRecord / CPPrices)
    @param cp_report_id: int - country programme report id
    @param section: str - section name
    @param existing_items: list of existing ItemCls objects
    @param with_sort: bool - if True, sort the final list
    @param append_items: bool - if True, append new ItemCls objects to the existing items

    @return: final list of ItemCls objects
    """

    # set the list of chemicals that are displayed for this report and section
    final_list = set_chemical_items_dict(
        item_cls, existing_items, section, cp_report, append_items
    )

    if with_sort:
        final_list.sort(
            key=lambda x: (
                (
                    (
                        x.substance.group.name
                        if "Other" not in x.substance.group.name_alt
                        else "zzzbbb"
                    ),  # other substances needs to be displayed last
                    getattr(x, "sort_order", float("inf")),
                    x.substance.sort_order,
                    x.substance.name,
                )
                if x.substance
                else (
                    "zzzaaa",
                    getattr(x, "sort_order", float("inf")),
                    x.blend.sort_order or float("inf"),
                    x.blend.name,
                )
            )
        )

    return final_list


def get_cp_record(cp_report_id, section, cp_record_class):
    return (
        cp_record_class.objects.select_related(
            "substance__group",
            "blend",
            "country_programme_report__country",
        )
        .prefetch_related(
            "record_usages__usage",
            "substance__excluded_usages",
            "blend__excluded_usages",
            "blend__components",
        )
        .filter(country_programme_report_id=cp_report_id, section=section)
        .all()
    )


def get_displayed_records(cp_report, section, cp_record_class, append_items=True):
    """
    Returns a list of CPRecord objects for the given section and cp_report_id

    @param cp_report_id: int - country programme report id
    @param section: str - section name

    @return: list of CPRecord objects
    """

    exist_records = get_cp_record(cp_report.id, section, cp_record_class)
    final_list = get_displayed_items(
        cp_record_class, cp_report, section, exist_records, append_items=append_items
    )

    return final_list


def get_cp_prices(cp_report, cp_prices_class, append_items=True):
    exist_records = (
        cp_prices_class.objects.select_related("substance__group", "blend")
        .filter(country_programme_report=cp_report.id)
        .all()
    )
    final_list = get_displayed_items(
        cp_prices_class,
        cp_report,
        "C",
        exist_records,
        with_sort=False,
        append_items=append_items,
    )
    # set sort order for section C (we have set sort_order )
    final_list.sort(
        key=lambda x: (
            (
                (
                    x.substance.name[:4]
                    if "HCFC" in x.substance.name or "HFC" in x.substance.name
                    else "zzzBBB"
                ),  # other substances needs to be displayed last
                getattr(x, "sort_order", float("inf")),
                x.substance.sort_order,
                x.substance.name,
            )
            if x.substance
            else (
                "zzzAAA",
                getattr(x, "sort_order", float("inf")),
                x.blend.sort_order or float("inf"),
                x.blend.name,
            )
        )
    )
    return final_list


def get_business_plan_from_request(request):
    """
    Get business plan from request query params

    @param request: request object

    @return: business plan
    """
    business_plan_id = request.query_params.get("business_plan_id")
    agency_id = request.query_params.get("agency_id")
    year_start = request.query_params.get("year_start")
    year_end = request.query_params.get("year_end")
    business_plan = None

    try:
        if business_plan_id:
            business_plan = BusinessPlan.objects.get(id=business_plan_id)
        elif all([agency_id, year_start, year_end]):
            business_plan = BusinessPlan.objects.get(
                agency_id=agency_id,
                year_start=year_start,
                year_end=year_end,
            )

        if not business_plan:
            raise BusinessPlan.DoesNotExist
    except BusinessPlan.DoesNotExist as e:
        raise ValidationError({"error": "Business plan not found"}) from e

    return business_plan
