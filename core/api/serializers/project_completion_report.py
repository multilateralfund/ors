from rest_framework import serializers

from core.models.project_completion_report import PCRProject


class PCRProjectListSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    pcr_id = serializers.IntegerField(source="pcr.id", read_only=True)
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
