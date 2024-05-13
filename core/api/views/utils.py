from rest_framework.exceptions import ValidationError


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
        cp_report_qs = cp_report_class.objects.select_related("user", "user__country")
        if user.user_type == user.UserType.COUNTRY_USER:
            cp_report_qs = cp_report_qs.filter(country=user.country)

        if cp_report_id:
            cp_report = cp_report_qs.get(id=cp_report_id)
        elif country_id and year:
            cp_report = cp_report_qs.get(
                country_id=country_id, year=year
            )
    except cp_report_class.DoesNotExist as e:
        raise ValidationError({"error": "Country programme report not found"}) from e

    return cp_report
