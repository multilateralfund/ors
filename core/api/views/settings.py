from rest_framework import views
from rest_framework.response import Response

from core.models.blend import Blend
from core.models.project import Project, ProjectFund, ProjectOdsOdp
from core.models.project_submission import ProjectSubmission, SubmissionAmount


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
            "project_submission_categories": ProjectSubmission.ProjectSubmissionCategories.choices,
            "submission_amount_statuses": SubmissionAmount.SubmissionStatus.choices,
            "project_substance_types": Project.SubstancesType.choices,
            "project_ods_odp_types": ProjectOdsOdp.ProjectOdsOdpType.choices,
            "project_fund_types": ProjectFund.FundType.choices,
        }
        return Response(settings)
