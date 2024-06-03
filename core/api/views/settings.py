from constance import config
from django.db.models import Max
from django.db.models import Min
from rest_framework import status, views
from rest_framework.response import Response

from core.models import CPReport
from core.models.blend import Blend
from core.models.business_plan import BusinessPlan
from core.models.project import Project, ProjectFund, ProjectOdsOdp, SubmissionAmount
from core.models.utils import SubstancesType


class SettingsView(views.APIView):
    """
    API endpoint that allows settings to be viewed.
    """

    def get(self, *args, **kwargs):
        settings = {
            "year_section_mapping": [
                {
                    "max_year": 2018,
                    "sections": [
                        "section_a",
                        "adm_b",
                        "section_c",
                        "adm_c",
                        "adm_d",
                    ],
                },
                {
                    "max_year": 2022,
                    "sections": [
                        "section_a",
                        "section_b",
                        "section_c",
                        "section_d",
                        "section_e",
                        "section_f",
                    ],
                },
            ],
            "blend_types": Blend.BlendTypes.choices,
            "business_plan_statuses": BusinessPlan.Status.choices,
            "project_submission_categories": Project.SubmissionCategory.choices,
            "submission_amount_statuses": SubmissionAmount.SubmissionStatus.choices,
            "project_substance_types": SubstancesType.choices,
            "project_ods_odp_types": ProjectOdsOdp.ProjectOdsOdpType.choices,
            "project_fund_types": ProjectFund.FundType.choices,
            "cp_reports": {
                "nr_reports": config.CP_NR_REPORTS,
                **CPReport.objects.aggregate(
                    max_year=Max("year"), min_year=Min("year")
                ),
            },
            "send_mail": config.SEND_MAIL,
        }
        return Response(settings)

    def post(self, request, *args, **kwargs):
        send_mail = request.data.get("send_mail")
        if not isinstance(send_mail, bool):
            return Response(
                {"send_mail": send_mail}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        config.SEND_MAIL = send_mail

        return Response({"send_mail": config.SEND_MAIL}, status=status.HTTP_200_OK)
