from collections import OrderedDict
from decimal import Decimal
from itertools import chain

from constance import config
from django.conf import settings
from django.db.models import Max
from django.db.models import Min
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework import views
from rest_framework.response import Response

from core.api.permissions import (
    HasProjectSettingsAccess,
)
from core.api.utils import PROJECT_SECTOR_TYPE_MAPPING
from core.models import CPReport
from core.models.blend import Blend
from core.models.business_plan import BPActivity
from core.models.business_plan import BusinessPlan
from core.models.project import Project
from core.models.project import ProjectFund
from core.models.project import ProjectOdsOdp
from core.models.project import SubmissionAmount
from core.models.utils import SubstancesType


class SettingsView(views.APIView):
    """
    API endpoint that allows settings to be viewed.
    """

    def get(self, *args, **kwargs):
        cp_settings = {
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
            "business_plan_activity_statuses": BPActivity.Status.choices,
            "project_sector_type_mapping": PROJECT_SECTOR_TYPE_MAPPING,
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
            "cp_notification_emails": ",".join(config.CP_NOTIFICATION_EMAILS),
        }
        return Response(cp_settings)

    def post(self, request, *args, **kwargs):
        send_mail = request.data.get("send_mail")
        cp_notification_emails = request.data.get("cp_notification_emails")
        if not isinstance(send_mail, bool):
            return Response(
                {"send_mail": send_mail}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        if not cp_notification_emails:
            cp_notification_emails = []
        else:
            cp_notification_emails = [
                elem.strip() for elem in cp_notification_emails.split(",")
            ]

        config.SEND_MAIL = send_mail
        config.CP_NOTIFICATION_EMAILS = cp_notification_emails

        return Response(
            {
                "send_mail": config.SEND_MAIL,
                "cp_notification_emails": ",".join(config.CP_NOTIFICATION_EMAILS),
            },
            status=status.HTTP_200_OK,
        )


class ProjectSettingsView(views.APIView):
    """
    API endpoint that allows project settings to be viewed and edited.
    """

    permission_classes = [HasProjectSettingsAccess]

    _managed_fields = OrderedDict(
        chain(
            settings.EMAILS_CONSTANCE_FIELDS.items(),
            settings.PROJECTS_GLOBAL_FIELDS.items(),
        )
    )

    def get_saved_values(self):
        result = {}
        for name in self._managed_fields:
            value = getattr(config, name)
            if isinstance(value, Decimal):
                value = value.to_eng_string()
            result[name.lower()] = value
        return result

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "for_frontend",
                openapi.IN_QUERY,
                description="Returns field information useful for rendering in frontend.",
                type=openapi.TYPE_BOOLEAN,
            ),
        ]
    )
    def get(self, *args, **kwargs):
        if self.request.query_params.get("for_frontend"):
            return self.for_frontend()
        return Response(self.get_saved_values())

    def for_frontend(self):
        sections = {
            k: [x.lower() for x in v]
            for k, v in settings.CONSTANCE_CONFIG_FIELDSETS.items()
            if k != "Unclassified"
        }
        fields = OrderedDict({})
        for f_name, f_def in self._managed_fields.items():
            f_default, f_title, d_type = f_def
            if d_type == Decimal:
                f_default = f_default.to_eng_string()

            fields[f_name.lower()] = {
                "default": f_default,
                "title": f_title,
                "type": d_type.__name__,
            }

        return Response(
            {"data": self.get_saved_values(), "sections": sections, "fields": fields}
        )

    def post(self, request, *args, **kwargs):
        for name in self._managed_fields:
            value = request.data.get(name.lower(), None)
            if value is not None:
                setattr(config, name, value)

        return Response(self.get_saved_values(), status=status.HTTP_200_OK)
