import logging

from django.db import transaction

from core.models import AlternativeTechnology, ProjectOdsOdp

logger = logging.getLogger(__name__)


@transaction.atomic
def fill_replacement_technologies_field():
    """
    Fill the replacement technologies field in ProjectOdsOdp model based
    on the ods_replacement_text field.If no replacement technology is found,
    the ods_replacement field will be set to "Other alternatives - specify" alternative technology
    """

    project_ods_odps = ProjectOdsOdp.objects.filter(
        ods_replacement_text__isnull=False, ods_replacement__isnull=True
    )
    other_alternative = AlternativeTechnology.objects.get(
        name="Other alternatives - specify"
    )
    for project_ods_odp in project_ods_odps:
        replacement_technology_name = project_ods_odp.ods_replacement_text.strip()
        try:
            replacement_technology = AlternativeTechnology.objects.get(
                name=replacement_technology_name
            )
            project_ods_odp.ods_replacement = replacement_technology
            project_ods_odp.save()
        except AlternativeTechnology.DoesNotExist:
            logger.warning(
                f"""Replacement technology '{replacement_technology_name}' not found for
                    ProjectOdsOdp with id {project_ods_odp.id}. Setting to 'Other alternatives - specify'.
                """
            )
            project_ods_odp.ods_replacement = other_alternative
            project_ods_odp.save()
