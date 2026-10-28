# pylint: disable=too-many-lines
from collections import Counter

from django.db import transaction
from django.core.exceptions import MultipleObjectsReturned

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.api.serializers.meeting import DecisionSerializer
from core.api.export.projects_inventory_report import project_actual_fund
from core.api.export.projects_inventory_report import project_apr_co2_actual
from core.api.export.projects_inventory_report import project_apr_date_completed
from core.api.export.projects_inventory_report import project_apr_odp_actual
from core.models.meeting import Decision
from core.models.project import MetaProject, Project
from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRDelayCause,
    PCRDelayCauseRootCause,
    PCRDelayCluster,
    PCRFutureProjectRecommendation,
    PCRGenderMainstreaming,
    PCRGoal,
    PCRLearnedLessonCategory,
    PCRLearnedLesson,
    PCRLearnedLessonDescription,
    PCROverallAssessmentHighlight,
    PCRProject,
    PCRProjectAlternativeTechnology,
    PCRProjectEnterprise,
    PCRProjectEquipment,
    PCRRootCausesOfDelay,
    PCRSupportingEvidence,
    PCRSupportingEvidenceSection,
    PCRSustainableDevelopmentGoal,
    PCRSustainableDevelopmentGoalDescription,
)
from core.models.substance import Substance

# pylint: disable=too-many-locals,abstract-method,dangerous-default-value


class PCRProjectAlternativeTechnologySerializer(serializers.ModelSerializer):
    substance_from = serializers.PrimaryKeyRelatedField(
        queryset=Substance.objects.all(), allow_null=True, required=False
    )
    substance_to = serializers.PrimaryKeyRelatedField(
        queryset=Substance.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = PCRProjectAlternativeTechnology
        fields = ["substance_from", "substance_to"]


class PCRProjectEnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectEnterprise
        fields = ["name", "address"]


class PCRProjectEquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectEquipment
        fields = ["name", "description", "disposal_type", "disposal_date"]


class PCRLookupSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "name", "sort_order"]


class PCRDelayClusterSerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRDelayCluster


class PCRRootCausesOfDelaySerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRRootCausesOfDelay


class PCRGoalSerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRGoal


class PCRLearnedLessonCategorySerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRLearnedLessonCategory


class PCRSupportingEvidenceSectionSerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRSupportingEvidenceSection


PCR_PROJECT_NESTED_MODELS = {
    "alternative_technologies": PCRProjectAlternativeTechnology,
    "enterprises": PCRProjectEnterprise,
    "equipments": PCRProjectEquipment,
}

PCR_NESTED_MODELS = {
    "overall_assessment_highlights": PCROverallAssessmentHighlight,
    "future_project_recommendations": PCRFutureProjectRecommendation,
    "additional_comments": PCRAdditionalComment,
    "gender_mainstreamings": PCRGenderMainstreaming,
    "delay_causes": PCRDelayCause,
    "learned_lessons": PCRLearnedLesson,
}

PCR_NESTED_MODELS_THROUGH = {
    "delay_causes": (
        "delay_cause",
        {"pcrdelaycauserootcause_set": PCRDelayCauseRootCause},
    ),
    "learned_lessons": (
        "learned_lesson",
        {"pcrlearnedlessondescription_set": PCRLearnedLessonDescription},
    ),
}

PCR_NESTED_MODELS_LOOK_UP_FIELDS = {
    "overall_assessment_highlights": [
        "agency_id",
    ],
    "future_project_recommendations": [
        "agency_id",
    ],
    "additional_comments": [
        "entity",
    ],
    "gender_mainstreamings": [
        "agency_id",
    ],
}

PCR_SUSTAINABLE_DEVELOPMENT_GOAL_NESTED_MODELS = {
    "pcrsustainabledevelopmentgoaldescription_set": PCRSustainableDevelopmentGoalDescription,
}


def pop_nested_data(pcr_project_data, PARENT_MODEL_DICT):
    return {
        field_name: pcr_project_data.pop(field_name, None)
        for field_name in PARENT_MODEL_DICT
    }


def replace_nested_data(
    parent_object, parent_field_name, nested_data, PARENT_MODEL_DICT, through_models={}
):
    for field_name, rows in nested_data.items():
        ids = []
        if rows is None:
            continue
        for row in rows:
            through_parent_field_name, THROUGH_MODEL_DICT = through_models.get(
                field_name, (None, {})
            )
            nested_data_through = pop_nested_data(row, THROUGH_MODEL_DICT)

            model = PARENT_MODEL_DICT[field_name]

            lookup = {
                parent_field_name: parent_object,
                **{field: row.get(field, None) for field in row},
            }
            try:
                obj, _ = model.objects.update_or_create(
                    **lookup,
                )
            except MultipleObjectsReturned:
                obj = model.objects.filter(**lookup).first()

                if obj is not None:
                    for key, value in lookup.items():
                        setattr(obj, key, value)

                    obj.save()
                else:
                    obj = model.objects.create(**lookup)
            if THROUGH_MODEL_DICT:
                replace_nested_data(
                    obj,
                    through_parent_field_name,
                    nested_data_through,
                    THROUGH_MODEL_DICT,
                )

            ids.append(obj.id)

        # remove stale objects
        PARENT_MODEL_DICT[field_name].objects.filter(
            **{parent_field_name: parent_object}
        ).exclude(id__in=ids).delete()


class PCRSupportingEvidenceSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    section_id = serializers.IntegerField()
    section = serializers.SlugRelatedField("name", read_only=True)
    file = serializers.FileField(required=False, allow_null=True)
    filename = serializers.CharField(required=False)

    class Meta:
        model = PCRSupportingEvidence
        fields = [
            "id",
            "agency_id",
            "agency",
            "pcr_id",
            "section_id",
            "section",
            "link",
            "filename",
            "file",
        ]


class PCRProjectSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source="project"
    )
    alternative_technologies = PCRProjectAlternativeTechnologySerializer(
        many=True, required=False
    )
    enterprises = PCRProjectEnterpriseSerializer(many=True, required=False)
    equipments = PCRProjectEquipmentSerializer(many=True, required=False)

    class Meta:
        model = PCRProject
        fields = [
            "id",
            "project_id",
            "funds_approved",
            "funds_disbursed",
            "funds_returned",
            "planned_date_of_completion",
            "alternative_technologies",
            "enterprises",
            "equipments",
        ]


def validate_pcr_project_references(pcr_projects, allowed_project_ids):
    project_ids = [pcr_project["project"].id for pcr_project in pcr_projects]
    project_id_counts = Counter(project_ids)
    duplicate_ids = sorted(
        project_id for project_id, count in project_id_counts.items() if count > 1
    )
    if duplicate_ids:
        duplicate_ids_display = ", ".join(map(str, duplicate_ids))
        raise serializers.ValidationError(
            {
                "pcr_projects": [
                    f"Duplicate Project IDs are not allowed: {duplicate_ids_display}."
                ]
            }
        )

    unrelated_ids = sorted(set(project_ids) - set(allowed_project_ids))
    if unrelated_ids:
        unrelated_ids_display = ", ".join(map(str, unrelated_ids))
        raise serializers.ValidationError(
            {
                "pcr_projects": [
                    "Projects do not belong to this PCR's MetaProject: "
                    f"{unrelated_ids_display}."
                ]
            }
        )


class PCROverallAssessmentHighlightSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)

    class Meta:
        model = PCROverallAssessmentHighlight
        fields = [
            "id",
            "agency_id",
            "agency",
            "additional_remarks",
            "actual_activity_output",
            "activity_title",
            "planned_output",
            "pcr_id",
        ]


class PCRAdditionalCommentSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = PCRAdditionalComment
        fields = [
            "id",
            "pcr_id",
            "entity",
            "comment",
        ]


class PCRFutureProjectRecommendationSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)

    class Meta:
        model = PCRFutureProjectRecommendation
        fields = ["id", "pcr_id", "agency_id", "agency", "title", "description"]


class PCRDelayCauseRootCauseSerializer(serializers.ModelSerializer):
    delay_cause_id = serializers.IntegerField(read_only=True)
    root_cause_id = serializers.PrimaryKeyRelatedField(
        queryset=PCRRootCausesOfDelay.objects.all(), source="root_cause"
    )
    root_cause = serializers.SlugRelatedField("name", read_only=True)
    description_roots_causes_of_delay = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    action_taken = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = PCRDelayCauseRootCause
        fields = [
            "id",
            "delay_cause_id",
            "root_cause_id",
            "root_cause",
            "description_roots_causes_of_delay",
            "action_taken",
        ]


class PCRDelayCauseSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    delay_cluster = PCRDelayClusterSerializer(required=False)
    delay_cluster_id = serializers.IntegerField()
    root_causes_of_delay = PCRDelayCauseRootCauseSerializer(
        many=True,
        source="pcrdelaycauserootcause_set",
        required=False,
    )

    class Meta:
        model = PCRDelayCause
        fields = [
            "id",
            "pcr_id",
            "agency_id",
            "agency",
            "delay_cluster_id",
            "delay_cluster",
            "root_causes_of_delay",
        ]


class PCRLearnedLessonDescriptionSerializer(serializers.ModelSerializer):
    learned_lesson_id = serializers.IntegerField(read_only=True)
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=PCRLearnedLessonCategory.objects.all(), source="lesson"
    )
    lesson = serializers.SlugRelatedField("name", read_only=True)
    description = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = PCRLearnedLessonDescription
        fields = [
            "id",
            "learned_lesson_id",
            "lesson_id",
            "lesson",
            "description",
        ]


class PCRLearnedLessonSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    lessons = PCRLearnedLessonDescriptionSerializer(
        many=True,
        source="pcrlearnedlessondescription_set",
        required=False,
    )

    class Meta:
        model = PCRLearnedLesson
        fields = [
            "id",
            "agency_id",
            "agency",
            "lessons",
            "pcr_id",
        ]


class PCRGenderMainstreamingSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)

    class Meta:
        model = PCRGenderMainstreaming
        fields = [
            "id",
            "agency",
            "agency_id",
            "pcr_id",
            "project_preparation",
            "prefilled",
            "qualitative_description",
        ]


class PCRSustainableDevelopmentGoalDescriptionSerializer(serializers.ModelSerializer):
    sgr_id = serializers.IntegerField(read_only=True)
    goal_id = serializers.IntegerField()
    goal = serializers.SlugRelatedField("name", read_only=True)

    class Meta:
        model = PCRSustainableDevelopmentGoalDescription
        fields = [
            "id",
            "sgr_id",
            "goal_id",
            "goal",
            "description",
        ]


class PCRSustainableDevelopmentGoalSerializer(serializers.ModelSerializer):
    pcr_id = serializers.IntegerField(read_only=True)
    agency_id = serializers.IntegerField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    goals = PCRSustainableDevelopmentGoalDescriptionSerializer(
        many=True,
        source="pcrsustainabledevelopmentgoaldescription_set",
        required=False,
    )

    class Meta:
        model = PCRSustainableDevelopmentGoal
        fields = [
            "id",
            "agency",
            "agency_id",
            "pcr_id",
            "goals",
        ]


class PCRDetailSerializer(serializers.ModelSerializer):
    overall_assessment_highlights = PCROverallAssessmentHighlightSerializer(many=True)
    additional_comments = PCRAdditionalCommentSerializer(many=True)
    country = serializers.CharField(source="meta_project.name", read_only=True)
    country_id = serializers.IntegerField(
        source="meta_project.country.id", read_only=True
    )
    decisions = DecisionSerializer(many=True, read_only=True)
    decision_ids = serializers.PrimaryKeyRelatedField(
        source="decisions", many=True, read_only=True
    )
    meta_project_id = serializers.IntegerField(read_only=True)
    latest_pcr_id = serializers.IntegerField(read_only=True)
    version_created_by = serializers.StringRelatedField(read_only=True)
    is_editable = serializers.BooleanField(read_only=True)
    pcr_projects = serializers.SerializerMethodField()
    delay_causes = PCRDelayCauseSerializer(many=True)
    learned_lessons = PCRLearnedLessonSerializer(many=True)
    gender_mainstreamings = PCRGenderMainstreamingSerializer(many=True)
    future_project_recommendations = PCRFutureProjectRecommendationSerializer(many=True)
    supporting_evidences = PCRSupportingEvidenceSerializer(many=True)
    sustainable_development_goals = PCRSustainableDevelopmentGoalSerializer(many=True)

    class Meta:
        model = PCR
        fields = [
            "id",
            "version",
            "status",
            "latest_pcr_id",
            "version_created_by",
            "is_editable",
            "additional_comments",
            "addresses",
            "country",
            "country_id",
            "completed_by",
            "decision_ids",
            "decisions",
            "learned_lessons",
            "financial_figures_status",
            "financial_figures_status_explanation",
            "gender_mainstreamings",
            "meta_project_id",
            "delay_causes",
            "overall_assessment_highlights",
            "future_project_recommendations",
            "pcr_projects",
            "project_date_approved",
            "project_date_completion",
            "project_goal_achieved",
            "project_goal_achieved_explanation",
            "phase_out_ods_approved",
            "phase_out_ods_actual",
            "phase_out_co2_eq_t_approved",
            "phase_out_co2_eq_t_actual",
            "rating",
            "rating_explanation",
            "rating_explanation_other",
            "submission_date",
            "supporting_evidences",
            "sustainable_development_goals",
            "total_number_of_enterprises",
            "total_funds_approved",
            "total_funds_disbursed",
            "total_funds_returned",
        ]

    def get_pcr_projects(self, instance):
        return PCRProjectSerializer(
            instance.pcr_projects.order_by("id"), many=True, context=self.context
        ).data


class PCRCreateSerializer(serializers.ModelSerializer):
    overall_assessment_highlights = PCROverallAssessmentHighlightSerializer(
        many=True, required=False
    )
    future_project_recommendations = PCRFutureProjectRecommendationSerializer(
        many=True, required=False
    )
    additional_comments = PCRAdditionalCommentSerializer(many=True, required=False)
    supporting_evidences = PCRSupportingEvidenceSerializer(many=True, required=False)
    decision_ids = serializers.PrimaryKeyRelatedField(
        allow_empty=True,
        many=True,
        write_only=True,
        required=False,
        queryset=Decision.objects.all(),
    )
    meta_project_id = serializers.PrimaryKeyRelatedField(
        queryset=MetaProject.objects.all(), source="meta_project"
    )
    delay_causes = PCRDelayCauseSerializer(many=True, required=False)
    learned_lessons = PCRLearnedLessonSerializer(many=True, required=False)
    pcr_projects = PCRProjectSerializer(many=True, required=False)
    gender_mainstreamings = PCRGenderMainstreamingSerializer(many=True, required=False)
    sustainable_development_goals = PCRSustainableDevelopmentGoalSerializer(
        many=True, required=False
    )

    class Meta:
        model = PCR
        fields = [
            "additional_comments",
            "addresses",
            "completed_by",
            "decision_ids",
            "delay_causes",
            "financial_figures_status",
            "financial_figures_status_explanation",
            "gender_mainstreamings",
            "meta_project_id",
            "phase_out_ods_actual",
            "phase_out_ods_approved",
            "phase_out_co2_eq_t_approved",
            "phase_out_co2_eq_t_actual",
            "project_date_approved",
            "project_date_completion",
            "project_goal_achieved",
            "project_goal_achieved_explanation",
            "overall_assessment_highlights",
            "future_project_recommendations",
            "learned_lessons",
            "pcr_projects",
            "rating",
            "rating_explanation",
            "rating_explanation_other",
            "sustainable_development_goals",
            "supporting_evidences",
            "submission_date",
        ]

    def validate_meta_project_id(self, meta_project):
        project_ids = meta_project.projects.values_list("id", flat=True)
        assigned_ids = list(
            PCRProject.objects.filter(project_id__in=project_ids)
            .order_by("project_id")
            .values_list("project_id", flat=True)
        )
        if assigned_ids:
            assigned_ids_display = ", ".join(map(str, assigned_ids))
            raise serializers.ValidationError(
                "MetaProject has Projects already assigned to a PCR: "
                f"{assigned_ids_display}."
            )
        return meta_project

    def validate(self, attrs):
        pcr_projects = attrs.get("pcr_projects", [])
        allowed_project_ids = attrs["meta_project"].projects.values_list(
            "id", flat=True
        )
        validate_pcr_project_references(pcr_projects, allowed_project_ids)

        files_by_name = self._get_files_by_name()

        supporting_evidences = attrs.get("supporting_evidences", [])
        for evidence in supporting_evidences:
            filename = evidence.get("filename")
            if filename and filename in files_by_name:
                evidence["file"] = files_by_name[filename]

        return attrs

    def _get_files_by_name(self):
        return {file_obj.name: file_obj for file_obj in self.context.get("files", [])}

    @transaction.atomic
    def create(self, validated_data):
        pcr_projects_data = validated_data.pop("pcr_projects", [])
        decisions_data = validated_data.pop("decision_ids", [])
        sustainable_development_goals_data = validated_data.pop(
            "sustainable_development_goals", []
        )
        supporting_evidences_data = validated_data.pop("supporting_evidences", [])

        pcr_projects_by_project_id = {
            pcr_project_data["project"].id: pcr_project_data
            for pcr_project_data in pcr_projects_data
        }

        nested_data_pcr = pop_nested_data(validated_data, PCR_NESTED_MODELS)
        pcr = PCR.objects.create(**validated_data)

        replace_nested_data(
            pcr, "pcr", nested_data_pcr, PCR_NESTED_MODELS, PCR_NESTED_MODELS_THROUGH
        )
        pcr.decisions.set(decisions_data)

        for project in pcr.meta_project.projects.order_by("id"):
            pcr_project_data = pcr_projects_by_project_id.get(project.id, {}).copy()
            pcr_project_data.pop("project", None)
            nested_data_pcr_project = pop_nested_data(
                pcr_project_data, PCR_PROJECT_NESTED_MODELS
            )
            pcr_project = PCRProject.objects.create(
                pcr=pcr,
                project=project,
                **pcr_project_data,
            )
            replace_nested_data(
                pcr_project,
                "pcr_project",
                nested_data_pcr_project,
                PCR_PROJECT_NESTED_MODELS,
            )

        for sustainable_development_goal_data in sustainable_development_goals_data:
            nested_data_sustainable_development_goal = pop_nested_data(
                sustainable_development_goal_data,
                PCR_SUSTAINABLE_DEVELOPMENT_GOAL_NESTED_MODELS,
            )
            sustainable_development_goal = PCRSustainableDevelopmentGoal.objects.create(
                pcr=pcr, **sustainable_development_goal_data
            )
            replace_nested_data(
                sustainable_development_goal,
                "sgr",
                nested_data_sustainable_development_goal,
                PCR_SUSTAINABLE_DEVELOPMENT_GOAL_NESTED_MODELS,
            )

        for evidence_data in supporting_evidences_data:
            file_obj = evidence_data.pop("file", None)

            PCRSupportingEvidence.objects.create(
                pcr=pcr,
                agency_id=evidence_data.get("agency_id"),
                section_id=evidence_data.get("section_id"),
                filename=evidence_data.get("filename")
                or (file_obj.name if file_obj else None),
                link=evidence_data.get("link"),
                file=file_obj,
            )

        return pcr

    def to_representation(self, instance):
        return PCRDetailSerializer(instance, context=self.context).data


class PCRUpdateSerializer(serializers.ModelSerializer):
    pcr_projects = PCRProjectSerializer(many=True, required=False)
    overall_assessment_highlights = PCROverallAssessmentHighlightSerializer(
        many=True, required=False
    )
    future_project_recommendations = PCRFutureProjectRecommendationSerializer(
        many=True, required=False
    )
    additional_comments = PCRAdditionalCommentSerializer(many=True, required=False)
    gender_mainstreamings = PCRGenderMainstreamingSerializer(many=True, required=False)
    supporting_evidences = PCRSupportingEvidenceSerializer(many=True, required=False)
    sustainable_development_goals = PCRSustainableDevelopmentGoalSerializer(
        many=True, required=False
    )
    delay_causes = PCRDelayCauseSerializer(many=True, required=False)
    learned_lessons = PCRLearnedLessonSerializer(many=True, required=False)

    class Meta:
        model = PCR
        fields = [
            "additional_comments",
            "submission_date",
            "gender_mainstreamings",
            "project_date_approved",
            "project_date_completion",
            "overall_assessment_highlights",
            "future_project_recommendations",
            "supporting_evidences",
            "delay_causes",
            "learned_lessons",
            "pcr_projects",
            "phase_out_ods_approved",
            "phase_out_ods_actual",
            "phase_out_co2_eq_t_approved",
            "phase_out_co2_eq_t_actual",
            "financial_figures_status",
            "financial_figures_status_explanation",
            "addresses",
            "project_goal_achieved",
            "project_goal_achieved_explanation",
            "rating",
            "rating_explanation",
            "rating_explanation_other",
            "sustainable_development_goals",
            "completed_by",
        ]

    def _get_files_by_name(self):
        return {file_obj.name: file_obj for file_obj in self.context.get("files", [])}

    def validate(self, attrs):
        pcr_projects = attrs.get("pcr_projects", [])
        allowed_project_ids = self.instance.pcr_projects.values_list(
            "project_id", flat=True
        )
        validate_pcr_project_references(pcr_projects, allowed_project_ids)

        files_by_name = self._get_files_by_name()

        supporting_evidences = attrs.get("supporting_evidences", [])
        for evidence in supporting_evidences:
            filename = evidence.get("filename")
            if filename and filename in files_by_name:
                evidence["file"] = files_by_name[filename]
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        pcr_projects_data = validated_data.pop("pcr_projects", [])
        nested_data_pcr = pop_nested_data(validated_data, PCR_NESTED_MODELS)
        supporting_evidences_data = validated_data.pop("supporting_evidences", [])
        sustainable_development_goals_data = validated_data.pop(
            "sustainable_development_goals", []
        )
        instance = super().update(instance, validated_data)
        pcr_projects_by_project_id = {
            pcr_project.project_id: pcr_project
            for pcr_project in instance.pcr_projects.all()
        }

        replace_nested_data(
            instance,
            "pcr",
            nested_data_pcr,
            PCR_NESTED_MODELS,
            PCR_NESTED_MODELS_THROUGH,
        )
        for pcr_project_data in pcr_projects_data:
            project = pcr_project_data.pop("project")
            pcr_project = pcr_projects_by_project_id[project.id]
            nested_data_pcr_project = pop_nested_data(
                pcr_project_data, PCR_PROJECT_NESTED_MODELS
            )
            for field_name, value in pcr_project_data.items():
                setattr(pcr_project, field_name, value)
            pcr_project.save()
            replace_nested_data(
                pcr_project,
                "pcr_project",
                nested_data_pcr_project,
                PCR_PROJECT_NESTED_MODELS,
            )
        PCRSustainableDevelopmentGoalDescription.objects.filter(
            sgr__pcr=instance
        ).delete()
        PCRSustainableDevelopmentGoal.objects.filter(pcr=instance).delete()
        for sustainable_development_goal_data in sustainable_development_goals_data:
            nested_data_sustainable_development_goal = pop_nested_data(
                sustainable_development_goal_data,
                PCR_SUSTAINABLE_DEVELOPMENT_GOAL_NESTED_MODELS,
            )
            sustainable_development_goal = PCRSustainableDevelopmentGoal.objects.create(
                pcr=instance, agency_id=sustainable_development_goal_data["agency_id"]
            )
            replace_nested_data(
                sustainable_development_goal,
                "sgr",
                nested_data_sustainable_development_goal,
                PCR_SUSTAINABLE_DEVELOPMENT_GOAL_NESTED_MODELS,
            )
        ids = []
        for evidence_data in supporting_evidences_data:
            file_obj = evidence_data.pop("file", None)

            supporting_evidence, _ = PCRSupportingEvidence.objects.get_or_create(
                pcr=instance,
                agency_id=evidence_data.get("agency_id"),
                section_id=evidence_data.get("section_id"),
                filename=evidence_data.get("filename")
                or (file_obj.name if file_obj else None),
                defaults={
                    "link": evidence_data.get("link"),
                    "file": file_obj,
                },
            )
            ids.append(supporting_evidence.id)
        PCRSupportingEvidence.objects.filter(pcr=instance).exclude(id__in=ids).delete()
        return instance

    def to_representation(self, instance):
        return PCRDetailSerializer(instance, context=self.context).data


class PCRVersionSerializer(serializers.ModelSerializer):
    version_created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = PCR
        fields = [
            "id",
            "version",
            "status",
            "latest_pcr_id",
            "version_created_by",
            "submission_date",
            "date_created",
            "date_updated",
        ]


class PCRProjectListSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    pcr_id = serializers.IntegerField(source="pcr.id", read_only=True)
    pcr_version = serializers.IntegerField(source="pcr.version", read_only=True)
    pcr_status = serializers.CharField(source="pcr.status", read_only=True)
    project_metacode = serializers.CharField(source="project.metacode", read_only=True)
    country = serializers.SerializerMethodField()
    country_id = serializers.IntegerField(source="project.country_id", read_only=True)
    region = serializers.SerializerMethodField()
    region_id = serializers.SerializerMethodField()
    lead_agency = serializers.SerializerMethodField()
    lead_agency_id = serializers.IntegerField(
        source="project.lead_agency_id", read_only=True
    )
    cooperating_agencies = serializers.SerializerMethodField()
    cooperating_agency_ids = serializers.SerializerMethodField()
    cluster = serializers.SerializerMethodField()
    cluster_id = serializers.IntegerField(source="project.cluster_id", read_only=True)
    type = serializers.SerializerMethodField()
    type_id = serializers.IntegerField(source="project.project_type_id", read_only=True)
    sector = serializers.SerializerMethodField()
    sector_id = serializers.IntegerField(source="project.sector_id", read_only=True)
    subsector = serializers.SerializerMethodField()
    subsector_ids = serializers.SerializerMethodField()
    title = serializers.CharField(source="project.title", read_only=True)
    category = serializers.CharField(source="project.category", read_only=True)
    pcr_due = serializers.SerializerMethodField()
    pcr_submission_date = serializers.DateTimeField(
        source="date_created", read_only=True
    )

    @staticmethod
    def _name(value):
        return value.name if value else None

    @staticmethod
    def _country_region(country):
        if not country:
            return None
        if country.parent_id and country.parent.parent_id:
            return country.parent.parent
        if country.parent_id:
            return country.parent
        return country

    def get_country(self, obj):
        return self._name(obj.project.country)

    def get_region(self, obj):
        return self._name(self._country_region(obj.project.country))

    def get_region_id(self, obj):
        region = self._country_region(obj.project.country)
        return region.id if region else None

    def get_lead_agency(self, obj):
        return self._name(obj.project.lead_agency)

    @staticmethod
    def _cooperating_agency(project):
        if (
            project.lead_agency_submitting_on_behalf
            and project.lead_agency_id != project.agency_id
        ):
            return project.agency
        return None

    def get_cooperating_agencies(self, obj):
        agency = self._cooperating_agency(obj.project)
        return [agency.name] if agency else []

    def get_cooperating_agency_ids(self, obj):
        agency = self._cooperating_agency(obj.project)
        return [agency.id] if agency else []

    def get_cluster(self, obj):
        return self._name(obj.project.cluster)

    def get_type(self, obj):
        return self._name(obj.project.project_type)

    def get_sector(self, obj):
        return self._name(obj.project.sector)

    def get_subsector(self, obj):
        return ", ".join(subsector.name for subsector in obj.project.subsectors.all())

    def get_subsector_ids(self, obj):
        return [subsector.id for subsector in obj.project.subsectors.all()]

    def get_pcr_due(self, obj):
        return bool(obj.pcr_due_value)

    class Meta:
        model = PCRProject
        fields = [
            "id",
            "pcr_id",
            "pcr_version",
            "pcr_status",
            "project_id",
            "project_metacode",
            "country",
            "country_id",
            "region",
            "region_id",
            "lead_agency",
            "lead_agency_id",
            "cooperating_agencies",
            "cooperating_agency_ids",
            "cluster",
            "cluster_id",
            "type",
            "type_id",
            "sector",
            "sector_id",
            "subsector",
            "subsector_ids",
            "title",
            "category",
            "pcr_due",
            "pcr_submission_date",
        ]


class ProjectListForPCRSerializer(serializers.ModelSerializer):
    actual_date_of_completion = serializers.SerializerMethodField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    agency_id = serializers.IntegerField(read_only=True, source="agency.id")

    cluster = serializers.SlugRelatedField("name", read_only=True)
    cluster_id = serializers.IntegerField(read_only=True, source="cluster.id")

    country = serializers.SlugRelatedField("name", read_only=True)
    lead_agency = serializers.SlugRelatedField("name", read_only=True)
    lead_agency_id = serializers.IntegerField(read_only=True, source="lead_agency.id")

    pcr_id = serializers.IntegerField(source="pcr_project.pcr_id", read_only=True)
    pcr_submission_date = serializers.DateField(
        read_only=True, source="pcr_project.pcr.submission_date"
    )
    project_type = serializers.SlugRelatedField("name", read_only=True)
    project_type_id = serializers.IntegerField(read_only=True, source="project_type.id")
    sector = serializers.SlugRelatedField("name", read_only=True)
    sector_id = serializers.IntegerField(read_only=True, source="sector.id")
    subsectors = serializers.SerializerMethodField()
    subsector_ids = serializers.SerializerMethodField()
    status = serializers.SlugRelatedField("name", read_only=True)
    status_id = serializers.IntegerField(read_only=True, source="status.id")
    funds_approved = serializers.SerializerMethodField()
    pcr_due = serializers.SerializerMethodField()
    hfc_phase_down_co2_actual = serializers.SerializerMethodField()
    hfc_phase_down_co2_approved = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        read_only=True,
        source="total_phase_out_co2_tonnes",
    )
    odp_phase_out_actual = serializers.SerializerMethodField()
    odp_phase_out_approved = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        read_only=True,
        source="total_phase_out_odp_tonnes",
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "actual_date_of_completion",
            "ad_hoc_pcr",
            "agency",
            "agency_id",
            "cluster",
            "cluster_id",
            "category",
            "code",
            "country",
            "country_id",
            "date_approved",
            "funds_approved",
            "hfc_phase_down_co2_actual",
            "hfc_phase_down_co2_approved",
            "metacode",
            "odp_phase_out_actual",
            "odp_phase_out_approved",
            "lead_agency",
            "lead_agency_id",
            "pcr_id",
            "project_type",
            "project_type_id",
            "pcr_due",
            "pcr_submission_date",
            "sector",
            "sector_id",
            "subsectors",
            "subsector_ids",
            "support_cost_psc",
            "status",
            "status_id",
            "title",
            "total_fund",
            "tranche",
        ]

    def get_subsectors(self, obj):
        return ", ".join(subsector.name for subsector in obj.subsectors.all())

    def get_subsector_ids(self, obj):
        return [subsector.id for subsector in obj.subsectors.all()]

    def get_pcr_due(self, obj):
        return obj.meta_project.pcr_due

    @extend_schema_field(serializers.DateField(allow_null=True))
    def get_actual_date_of_completion(self, obj):
        completion_date = project_apr_date_completed(obj)
        return completion_date.isoformat() if completion_date else None

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_funds_approved(self, obj):
        return project_actual_fund(obj)

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_hfc_phase_down_co2_actual(self, obj):
        return project_apr_co2_actual(obj)

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_odp_phase_out_actual(self, obj):
        return project_apr_odp_actual(obj)


class PCRMetaProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for MetaProject model.
    """

    projects = serializers.SerializerMethodField()
    pcr_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    date_of_completion = serializers.SerializerMethodField()
    total_funding = serializers.SerializerMethodField()
    country = serializers.SlugRelatedField("name", read_only=True)
    country_id = serializers.IntegerField(read_only=True, source="country.id")
    lead_agency = serializers.SlugRelatedField("name", read_only=True)
    lead_agency_id = serializers.IntegerField(read_only=True, source="lead_agency.id")

    MYA_COMPLETED_STATUSES = ["Completed", "Transferred"]

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "ad_hoc_pcr",
            "country",
            "country_id",
            "date_of_completion",
            "lead_agency",
            "lead_agency_id",
            "type",
            "projects",
            "pcr_id",
            "pcr_due",
            "pcr_due_date",
            "status",
            "total_funding",
            "umbrella_code",
        ]

    def _get_projects(self, obj):
        # Use filtered_projects if available, otherwise fallback to all projects
        return getattr(obj, "filtered_projects", obj.projects.all())

    def _get_projects_data(self, obj):
        # Serialized once per meta project, as it is reused by other fields
        if not hasattr(obj, "pcr_projects_data"):
            obj.pcr_projects_data = ProjectListForPCRSerializer(
                self._get_projects(obj), many=True
            ).data
        return obj.pcr_projects_data

    @extend_schema_field(ProjectListForPCRSerializer(many=True))
    def get_projects(self, obj):
        return self._get_projects_data(obj)

    @extend_schema_field(serializers.DateField(allow_null=True))
    def get_date_of_completion(self, obj):
        # ISO formatted dates, so the greatest string is the latest date
        return max(
            (
                project["actual_date_of_completion"]
                for project in self._get_projects_data(obj)
                if project["actual_date_of_completion"]
            ),
            default=None,
        )

    @extend_schema_field(serializers.FloatField())
    def get_total_funding(self, obj):
        return sum(
            (project.total_fund or 0) + (project.support_cost_psc or 0)
            for project in self._get_projects(obj)
        )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_status(self, obj):
        projects = list(self._get_projects(obj))
        if obj.type == MetaProject.MetaProjectType.IND:
            # an individual meta project has a single project
            project = projects[0] if projects else None
            return project.status.name if project and project.status else None
        if obj.type == MetaProject.MetaProjectType.MYA:
            if all(
                project.status and project.status.name in self.MYA_COMPLETED_STATUSES
                for project in projects
            ):
                return "Completed"
            return "Not completed"
        return None

    def get_pcr_id(self, obj):
        pcr = PCR.objects.filter(meta_project=obj).first()
        if pcr:
            return pcr.id
        return None


class PCRProjectSetAdHocOrPcrDueSerializer(serializers.Serializer):
    """
    Serializer for MetaProject model.
    """

    meta_projects = serializers.PrimaryKeyRelatedField(
        queryset=MetaProject.objects.all(), many=True
    )
    ad_hoc_pcr = serializers.BooleanField(default=False)
    pcr_due = serializers.BooleanField(default=False)
    pcr_due_date = serializers.DateField()
