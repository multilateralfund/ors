from django.core.management import BaseCommand
from core.import_data.generate_project_sub_codes import generate_all_project_sub_codes
from core.import_data.import_meta_projects import import_meta_projects
from core.import_data.import_multi_year_projects import import_multi_year_projects
from core.import_data.import_pcr_activities import import_pcr_activities
from core.import_data.import_pcr_delay_explanations import import_pcr_delay_explanations
from core.import_data.import_pcr_learned_lessons import import_pcr_learned_lessons

from core.import_data.import_progress_reports import import_progress_reports
from core.import_data.import_project_comments import import_project_comments
from core.import_data.import_proposals import import_proposals
from core.import_data.import_projects import import_projects


class Command(BaseCommand):
    help = """
        Import projects
        params:
            - type = all_projects (Proposals, projects, multy year projects, meta projects)
            - type = proposals => project proposals xlsx files
            - type = projects => projects from tbInventory
            - type = multi_year_projects => multi year projects from MultiYear-Projects
            - type = progress => project progress reports
            - type = comments => project comments
            - type = meta_projects => project meta projects
            - type = all_pcr => all data for project complition reports 
                (activities, delay_explanation, learned_lessons)
            - type = pcr_activities => project complition report activities
            - type = pcr_delay_explanation => project complition report delay explanation
            - type = pcr_learned_lessons => project complition report learned lessons
            - type = generate_sub_codes => generate project sub codes
            - type =  all => all of the above
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Import type",
            default="all",
            choices=[
                "all_projects",
                "proposals",
                "projects",
                "multi_year_projects",
                "progress",
                "comments",
                "meta_projects",
                "all_pcr",
                "pcr_activities",
                "pcr_delay_explanation",
                "pcr_learned_lessons",
                "generate_sub_codes",
                "all",
            ],
        )

    def handle(self, *args, **kwargs):
        imp_type = kwargs["type"]

        if imp_type in ["projects", "all_projects", "all"]:
            import_projects()
        if imp_type in ["proposals", "all_projects", "all"]:
            import_proposals()
        if imp_type in ["multi_year_projects", "all_projects", "all"]:
            import_multi_year_projects()
        if imp_type in ["progress", "all"]:
            import_progress_reports()
        if imp_type in ["comments", "all"]:
            import_project_comments()
        if imp_type in ["meta_projects", "all_projects", "all"]:
            import_meta_projects()
        if imp_type in ["pcr_activities", "all_pcr", "all"]:
            import_pcr_activities()
        if imp_type in ["pcr_delay_explanation", "all_pcr", "all"]:
            import_pcr_delay_explanations()
        if imp_type in ["pcr_learned_lessons", "all_pcr", "all"]:
            import_pcr_learned_lessons()
        if imp_type in ["generate_sub_codes", "all"]:
            generate_all_project_sub_codes()
