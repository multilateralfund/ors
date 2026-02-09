from rest_framework import serializers

from core.models.project_complition_report import (
    DelayCategory,
    LearnedLessonCategory,
    PCRAlternativeTechnology,
    PCRCauseOfDelay,
    PCRCauseOfDelayCategory,
    PCRComment,
    PCREnterprise,
    PCREquipmentDisposal,
    PCRGenderMainstreaming,
    PCRGenderPhase,
    PCRLessonLearned,
    PCRLessonLearnedCategory,
    PCROverallAssessment,
    PCRProjectActivity,
    PCRProjectElement,
    PCRRecommendation,
    PCRSDG,
    PCRSDGContribution,
    PCRSupportingEvidence,
    PCRTraineeCount,
    PCRTrancheData,
    ProjectCompletionReport,
)


class DelayCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DelayCategory
        fields = ["id", "code", "name", "description", "sort_order"]


class LearnedLessonCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LearnedLessonCategory
        fields = ["id", "code", "name", "description", "sort_order"]


class PCRProjectElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectElement
        fields = ["id", "code", "name", "description", "sort_order"]


class PCRSDGSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRSDG
        fields = ["id", "code", "number", "name", "description"]


class PCRGenderPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRGenderPhase
        fields = ["id", "code", "name", "description", "sort_order"]


# Section 2 - Project Results


class PCRProjectActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectActivity
        fields = [
            "id",
            "project_type",
            "sector",
            "activity_type",
            "planned_outputs",
            "actual_outputs",
            "additional_remarks",
            "date_created",
            "date_updated",
        ]


class PCROverallAssessmentSerializer(serializers.ModelSerializer):
    rating_display = serializers.CharField(source="get_rating_display", read_only=True)

    class Meta:
        model = PCROverallAssessment
        fields = [
            "id",
            "rating",
            "rating_display",
            "rating_other",
            "rating_explanation",
            "date_created",
            "date_updated",
        ]


class PCRCommentSerializer(serializers.ModelSerializer):
    section_display = serializers.CharField(
        source="get_section_display", read_only=True
    )
    entity_type_display = serializers.CharField(
        source="get_entity_type_display", read_only=True
    )

    class Meta:
        model = PCRComment
        fields = [
            "id",
            "section",
            "section_display",
            "entity_type",
            "entity_type_display",
            "entity_type_other",
            "comment_text",
            "date_created",
            "date_updated",
        ]


# Section 3 - Causes of Delay


class PCRCauseOfDelayCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_code = serializers.CharField(source="category.code", read_only=True)

    class Meta:
        model = PCRCauseOfDelayCategory
        fields = [
            "id",
            "category",
            "category_name",
            "category_code",
            "category_description",
        ]


class PCRCauseOfDelayReadSerializer(serializers.ModelSerializer):
    project_element_name = serializers.CharField(
        source="project_element.name", read_only=True
    )
    categories = PCRCauseOfDelayCategorySerializer(many=True, read_only=True)

    class Meta:
        model = PCRCauseOfDelay
        fields = [
            "id",
            "project_element",
            "project_element_name",
            "description",
            "categories",
            "date_created",
            "date_updated",
        ]


class PCRCauseOfDelayWriteSerializer(serializers.ModelSerializer):
    categories = PCRCauseOfDelayCategorySerializer(many=True, required=False)

    class Meta:
        model = PCRCauseOfDelay
        fields = ["id", "project_element", "description", "categories"]

    def create(self, validated_data):
        categories_data = validated_data.pop("categories", [])
        cause_of_delay = PCRCauseOfDelay.objects.create(**validated_data)

        for category_data in categories_data:
            PCRCauseOfDelayCategory.objects.create(
                cause_of_delay=cause_of_delay, **category_data
            )

        return cause_of_delay

    def update(self, instance, validated_data):
        categories_data = validated_data.pop("categories", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories_data is not None:
            # Replace all categories
            instance.categories.all().delete()
            for category_data in categories_data:
                PCRCauseOfDelayCategory.objects.create(
                    cause_of_delay=instance, **category_data
                )

        return instance


# Section 4 - Lessons Learned


class PCRLessonLearnedCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_code = serializers.CharField(source="category.code", read_only=True)

    class Meta:
        model = PCRLessonLearnedCategory
        fields = [
            "id",
            "category",
            "category_name",
            "category_code",
            "category_description",
        ]


class PCRLessonLearnedReadSerializer(serializers.ModelSerializer):
    project_element_name = serializers.CharField(
        source="project_element.name", read_only=True
    )
    categories = PCRLessonLearnedCategorySerializer(many=True, read_only=True)

    class Meta:
        model = PCRLessonLearned
        fields = [
            "id",
            "project_element",
            "project_element_name",
            "description",
            "categories",
            "date_created",
            "date_updated",
        ]


class PCRLessonLearnedWriteSerializer(serializers.ModelSerializer):
    categories = PCRLessonLearnedCategorySerializer(many=True, required=False)

    class Meta:
        model = PCRLessonLearned
        fields = ["id", "project_element", "description", "categories"]

    def create(self, validated_data):
        categories_data = validated_data.pop("categories", [])
        lesson_learned = PCRLessonLearned.objects.create(**validated_data)

        for category_data in categories_data:
            PCRLessonLearnedCategory.objects.create(
                lesson_learned=lesson_learned, **category_data
            )

        return lesson_learned

    def update(self, instance, validated_data):
        categories_data = validated_data.pop("categories", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories_data is not None:
            # Replace all categories
            instance.categories.all().delete()
            for category_data in categories_data:
                PCRLessonLearnedCategory.objects.create(
                    lesson_learned=instance, **category_data
                )

        return instance


class PCRRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRRecommendation
        fields = ["id", "recommendation_text", "date_created", "date_updated"]


# Section 5 - Gender Mainstreaming


class PCRGenderMainstreamingSerializer(serializers.ModelSerializer):
    phase_name = serializers.CharField(source="phase.name", read_only=True)

    class Meta:
        model = PCRGenderMainstreaming
        fields = [
            "id",
            "phase",
            "phase_name",
            "indicator_met",
            "qualitative_description",
            "date_created",
            "date_updated",
        ]


# Section 6 - SDG Contributions


class PCRSDGContributionSerializer(serializers.ModelSerializer):
    sdg_number = serializers.IntegerField(source="sdg.number", read_only=True)
    sdg_name = serializers.CharField(source="sdg.name", read_only=True)

    class Meta:
        model = PCRSDGContribution
        fields = [
            "id",
            "sdg",
            "sdg_number",
            "sdg_name",
            "description",
            "date_created",
            "date_updated",
        ]


# Section 7 - Tranche data


class PCRAlternativeTechnologyReadSerializer(serializers.ModelSerializer):
    substance_from_name = serializers.CharField(
        source="substance_from.name", read_only=True
    )
    substance_to_name = serializers.CharField(
        source="substance_to.name", read_only=True
    )

    class Meta:
        model = PCRAlternativeTechnology
        fields = [
            "id",
            "substance_from",
            "substance_from_name",
            "substance_to",
            "substance_to_name",
            "date_created",
        ]


class PCRAlternativeTechnologyWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRAlternativeTechnology
        fields = ["id", "substance_from", "substance_to"]


class PCREnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCREnterprise
        fields = ["id", "address", "date_created"]


class PCRTraineeCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRTraineeCount
        fields = ["id", "gender", "count"]


class PCREquipmentDisposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCREquipmentDisposal
        fields = [
            "id",
            "equipment_name",
            "description",
            "disposal_type",
            "disposal_date",
            "date_created",
        ]


class PCRTrancheDataReadSerializer(serializers.ModelSerializer):
    project_code = serializers.CharField(read_only=True)
    project_type = serializers.CharField(read_only=True)
    sector = serializers.CharField(read_only=True)
    agency_name = serializers.CharField(source="agency.name", read_only=True)

    technologies = PCRAlternativeTechnologyReadSerializer(many=True, read_only=True)
    enterprises = PCREnterpriseSerializer(many=True, read_only=True)
    trainees = PCRTraineeCountSerializer(many=True, read_only=True)
    equipment_disposals = PCREquipmentDisposalSerializer(many=True, read_only=True)

    class Meta:
        model = PCRTrancheData
        fields = [
            "id",
            "project",
            "project_code",
            "project_type",
            "sector",
            "agency",
            "agency_name",
            "tranche_number",
            # Pre-filled dates
            "date_approved",
            "actual_date_completion",
            # Financial data
            "funds_approved",
            "funds_disbursed",
            # Phase-out data
            "odp_phaseout_approved",
            "odp_phaseout_actual",
            "hfc_phasedown_approved",
            "hfc_phasedown_actual",
            # User input
            "planned_completion_date",
            # Auto-calculated
            "planned_duration_months",
            "actual_duration_months",
            "delay_months",
            # Enterprise
            "number_of_enterprises",
            # Related data
            "technologies",
            "enterprises",
            "trainees",
            "equipment_disposals",
            # Audit
            "date_created",
            "date_updated",
        ]


class PCRTrancheDataWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRTrancheData
        fields = [
            "id",
            "funds_disbursed",
            "planned_completion_date",
            "number_of_enterprises",
        ]


# Section 8 - Supporting Evidence


class PCRSupportingEvidenceSerializer(serializers.ModelSerializer):
    section_display = serializers.CharField(
        source="get_related_section_display", read_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = PCRSupportingEvidence
        fields = [
            "id",
            "file",
            "file_url",
            "url",
            "related_section",
            "section_display",
            "description",
            "date_created",
        ]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)


# Project Completion Reports


class ProjectCompletionReportReadSerializer(serializers.ModelSerializer):
    """Read serializer for PCR with all nested data"""

    # Project/MetaProject info
    project_code = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    meta_project_code = serializers.CharField(
        source="meta_project.umbrella_code", read_only=True, allow_null=True
    )

    # Display fields
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    financial_figures_status_display = serializers.CharField(
        source="get_financial_figures_status_display", read_only=True
    )
    overall_rating_display = serializers.CharField(
        source="get_overall_rating_display", read_only=True
    )
    completion_report_done_by_display = serializers.CharField(
        source="get_completion_report_done_by_display", read_only=True
    )

    # Nested data
    activities = PCRProjectActivitySerializer(many=True, read_only=True)
    overall_assessments = PCROverallAssessmentSerializer(many=True, read_only=True)
    causes_of_delay = PCRCauseOfDelayReadSerializer(many=True, read_only=True)
    lessons_learned = PCRLessonLearnedReadSerializer(many=True, read_only=True)
    gender_mainstreaming = PCRGenderMainstreamingSerializer(many=True, read_only=True)
    sdg_contributions = PCRSDGContributionSerializer(many=True, read_only=True)
    tranches = PCRTrancheDataReadSerializer(many=True, read_only=True)
    comments = PCRCommentSerializer(many=True, read_only=True)
    recommendations = PCRRecommendationSerializer(many=True, read_only=True)
    supporting_evidence = PCRSupportingEvidenceSerializer(many=True, read_only=True)

    # Submitter info
    submitter_name = serializers.CharField(
        source="submitter.get_full_name", read_only=True
    )
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = ProjectCompletionReport
        fields = [
            "id",
            # Project references
            "meta_project",
            "meta_project_code",
            "project",
            "project_code",
            "country_name",
            # Status
            "status",
            "status_display",
            "is_unlocked",
            # Overview fields (Section 1.6)
            "submitter",
            "submitter_name",
            "first_submission_date",
            "last_submission_date",
            "financial_figures_status",
            "financial_figures_status_display",
            "financial_figures_explanation",
            "enterprise_addresses",
            "all_goals_achieved",
            "goals_not_achieved_explanation",
            "overall_rating",
            "overall_rating_display",
            "overall_rating_other",
            "overall_rating_explanation",
            "completion_report_done_by",
            "completion_report_done_by_display",
            "completion_report_done_by_other",
            # Aggregated totals
            "total_odp_approved",
            "total_odp_actual",
            "total_hfc_approved",
            "total_hfc_actual",
            "total_enterprises",
            "total_trainees",
            "total_funding_approved",
            "total_funding_disbursed",
            "total_funding_returned",
            # Nested data
            "activities",
            "overall_assessments",
            "causes_of_delay",
            "lessons_learned",
            "gender_mainstreaming",
            "sdg_contributions",
            "tranches",
            "comments",
            "recommendations",
            "supporting_evidence",
            # Audit
            "created_by",
            "created_by_name",
            "date_created",
            "date_updated",
        ]

    def get_project_code(self, obj):
        if obj.project:
            return obj.project.code
        if obj.meta_project:
            return obj.meta_project.umbrella_code
        return None

    def get_country_name(self, obj):
        if obj.project:
            return obj.project.country.name if obj.project.country else None
        if obj.meta_project:
            # TODO: check this is the right approach (i.e. used elsewhere as well)
            # MetaProject doesn't have country; get it from the first project
            first_project = obj.meta_project.projects.first()
            return (
                first_project.country.name
                if first_project and first_project.country
                else None
            )
        return None


class ProjectCompletionReportListSerializer(serializers.ModelSerializer):
    """List serializer - does not include nested data."""

    project_code = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    submitter_name = serializers.CharField(
        source="submitter.get_full_name", read_only=True
    )
    lead_agency_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectCompletionReport
        fields = [
            "id",
            "project_code",
            "country_name",
            "status",
            "status_display",
            "is_unlocked",
            "financial_figures_status",
            "submitter",
            "submitter_name",
            "first_submission_date",
            "last_submission_date",
            "lead_agency_name",
            "total_funding_approved",
            "total_funding_disbursed",
            "date_created",
            "date_updated",
        ]

    def get_project_code(self, obj):
        if obj.project:
            return obj.project.code
        if obj.meta_project:
            return obj.meta_project.umbrella_code
        return None

    def get_country_name(self, obj):
        if obj.project:
            return obj.project.country.name if obj.project.country else None
        if obj.meta_project:
            # TODO: check this is the right approach to get the country
            # (it's used elsewhere as well)
            first_project = obj.meta_project.projects.first()
            return (
                first_project.country.name
                if first_project and first_project.country
                else None
            )
        return None

    def get_lead_agency_name(self, obj):
        # Get lead agency from the first tranche
        first_tranche = obj.tranches.first()
        return first_tranche.agency.name if first_tranche else None


class ProjectCompletionReportWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCompletionReport
        fields = [
            "id",
            "meta_project",
            "project",
            "financial_figures_status",
            "financial_figures_explanation",
            "enterprise_addresses",
            "all_goals_achieved",
            "goals_not_achieved_explanation",
            "overall_rating",
            "overall_rating_other",
            "overall_rating_explanation",
            "completion_report_done_by",
            "completion_report_done_by_other",
        ]

    def validate(self, attrs):
        """Ensure either meta_project or project is set, but not both"""
        # On partial updates, attrs may not contain these fields
        # Only validate if we're creating or explicitly updating project/meta_project
        if self.instance is None:
            meta_project = attrs.get("meta_project")
            project = attrs.get("project")

            if not meta_project and not project:
                raise serializers.ValidationError(
                    "Either meta_project or project must be provided"
                )

            if meta_project and project:
                raise serializers.ValidationError(
                    "Cannot set both meta_project and project"
                )
        else:
            # Updating existing PCR, only validate if either field is being changed
            if "meta_project" in attrs or "project" in attrs:
                meta_project = attrs.get("meta_project", self.instance.meta_project)
                project = attrs.get("project", self.instance.project)

                if not meta_project and not project:
                    raise serializers.ValidationError(
                        "Either meta_project or project must be provided"
                    )

                if meta_project and project:
                    raise serializers.ValidationError(
                        "Cannot set both meta_project and project"
                    )

        return attrs
