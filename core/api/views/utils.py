from rest_framework.exceptions import ValidationError

from django.db import models
from core.models.business_plan import BusinessPlan
from core.models.country_programme import CPRecord, CPReport
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
