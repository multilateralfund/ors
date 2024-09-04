from constance import config
from django.db import transaction
from rest_framework import serializers

from core.api.serializers.adm import AdmRecordSerializer
from core.api.serializers.cp_comment import CPCommentSerializer
from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_history import CPHistorySerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import CPRecordSerializer
from core.api.validations.cp_reports_validations import validate_cp_report
from core.models.country import Country
from core.models.country_programme import CPComment, CPReport, CPReportSections
from core.models.country_programme_archive import CPReportArchive
from core.tasks import send_mail_report_create
from core.utils import IMPORT_DB_MAX_YEAR, VALIDATION_MIN_YEAR


# pylint: disable=W0223


class CPReportInfoSerializer(serializers.ModelSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    reporting_entry = serializers.CharField(
        required=False, source="country_programme_report.reporting_entry"
    )
    reporting_email = serializers.CharField(
        required=False, source="country_programme_report.reporting_email"
    )

    class Meta:
        fields = [
            "country_programme_report_id",
            "reported_section_a",
            "reported_section_b",
            "reported_section_c",
            "reported_section_d",
            "reported_section_e",
            "reported_section_f",
            "reporting_entry",
            "reporting_email",
        ]
        model = CPReportSections


class CPReportBaseSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()
    status = serializers.ChoiceField(
        choices=CPReport.CPReportStatus.choices, required=False
    )
    version = serializers.FloatField(read_only=True)
    created_by = serializers.StringRelatedField(
        read_only=True, source="created_by.username"
    )
    version_created_by = serializers.StringRelatedField(
        read_only=True, source="version_created_by.username"
    )
    version_created_by_role = serializers.StringRelatedField(
        read_only=True, source="version_created_by.user_type"
    )

    reporting_entry = serializers.CharField(read_only=True)
    reporting_email = serializers.CharField(read_only=True)

    class Meta:
        fields = [
            "id",
            "name",
            "year",
            "status",
            "version",
            "country",
            "country_id",
            "comment",
            "created_at",
            "created_by",
            "version_created_by",
            "version_created_by_role",
            "reporting_entry",
            "reporting_email",
        ]


class CPReportNoRelatedSerializer(CPReportBaseSerializer):
    class Meta(CPReportBaseSerializer.Meta):
        model = CPReport


class CPReportSerializer(CPReportBaseSerializer):
    report_info = CPReportInfoSerializer(
        many=False, required=False, source="cpreportedsections", allow_null=True
    )
    history = serializers.SerializerMethodField()

    country_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    comments = serializers.SerializerMethodField()

    class Meta(CPReportBaseSerializer.Meta):
        model = CPReport
        fields = CPReportBaseSerializer.Meta.fields + [
            "comments",
            "report_info",
            "history",
        ]

    def get_comments(self, obj):
        return CPCommentSerializer(obj.cpcomments.all(), many=True).data

    def get_history(self, obj):
        return CPHistorySerializer(
            obj.cphistory.all().select_related("country_programme_report", "updated_by")
        ).data


class CPReportArchiveSerializer(CPReportBaseSerializer):
    final_version_id = serializers.SerializerMethodField()

    class Meta(CPReportBaseSerializer.Meta):
        model = CPReportArchive
        fields = CPReportBaseSerializer.Meta.fields + ["final_version_id"]

    def get_final_version_id(self, obj):
        cp_report_final = CPReport.objects.filter(
            country_id=obj.country_id,
            year=obj.year,
        ).first()
        return cp_report_final.id if cp_report_final else None


class CPReportGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    count = serializers.IntegerField()
    group = serializers.CharField()
    reports = CPReportNoRelatedSerializer(many=True, read_only=True)

    class Meta:
        fields = [
            "id",
            "count",
            "group",
            "reports",
        ]


class CPReportNestedCommentSerializer(serializers.Serializer):
    """
    Serializer for nested section comments that we receive in POST/PUT requests.
    """

    country = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    mlfs = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        fields = [
            "country",
            "mlfs",
        ]


COMMENT_SECTIONS = {
    "comments_section_a": CPComment.CPCommentSection.SECTION_A,
    "comments_section_b": CPComment.CPCommentSection.SECTION_B,
    "comments_section_c": CPComment.CPCommentSection.SECTION_C,
    "comments_section_d": CPComment.CPCommentSection.SECTION_D,
    "comments_section_e": CPComment.CPCommentSection.SECTION_E,
    "comments_section_f": CPComment.CPCommentSection.SECTION_F,
}


class CPReportCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    year = serializers.IntegerField()
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=CPReport.CPReportStatus.choices, required=False
    )
    report_info = CPReportInfoSerializer(many=False, required=False, allow_null=True)
    section_a = CPRecordSerializer(many=True, required=False)
    section_b = CPRecordSerializer(many=True, required=False)
    section_c = CPPricesSerializer(many=True, required=False)
    section_d = CPGenerationSerializer(many=True, required=False)
    section_e = CPEmissionSerializer(many=True, required=False)
    section_f = serializers.DictField(
        required=False, help_text="Only one key (remarks) is allowed)"
    )
    adm_b = AdmRecordSerializer(many=True, required=False)
    adm_c = AdmRecordSerializer(many=True, required=False)
    adm_d = AdmRecordSerializer(many=True, required=False)

    comments_section_a = CPReportNestedCommentSerializer(many=False, required=False)
    comments_section_b = CPReportNestedCommentSerializer(many=False, required=False)
    comments_section_c = CPReportNestedCommentSerializer(many=False, required=False)
    comments_section_d = CPReportNestedCommentSerializer(many=False, required=False)
    comments_section_e = CPReportNestedCommentSerializer(many=False, required=False)
    comments_section_f = CPReportNestedCommentSerializer(many=False, required=False)

    class Meta:
        fields = [
            "name",
            "year",
            "status",
            "country_id",
            "report_info",
            "section_a",
            "section_b",
            "section_c",
            "section_d",
            "section_e",
            "section_f",
            "adm_b",
            "adm_c",
            "adm_d",
        ] + list(COMMENT_SECTIONS.keys())

    def to_representation(self, instance):
        return CPReportSerializer(instance).data

    def validate(self, attrs):
        if attrs.get("year") >= VALIDATION_MIN_YEAR:
            validate_cp_report(attrs)

        return super().validate(attrs)

    def _create_cp_records(self, cp_report, section_data, section):
        for record in section_data:
            record["country_programme_report_id"] = cp_report.id
            record["section"] = section
        record_serializer = CPRecordSerializer(data=section_data, many=True)
        record_serializer.is_valid(raise_exception=True)
        record_serializer.save()

    def _create_prices(self, cp_report, section_data):
        for price in section_data:
            price["country_programme_report_id"] = cp_report.id
        price_serializer = CPPricesSerializer(data=section_data, many=True)
        price_serializer.is_valid(raise_exception=True)
        price_serializer.save()

    def _create_generation(self, cp_report, section_data):
        for generation in section_data:
            generation["country_programme_report_id"] = cp_report.id
        generation_serializer = CPGenerationSerializer(data=section_data, many=True)
        generation_serializer.is_valid(raise_exception=True)
        generation_serializer.save()

    def _create_emission(self, cp_report, section_data):
        for emission in section_data:
            emission["country_programme_report_id"] = cp_report.id
        emission_serializer = CPEmissionSerializer(data=section_data, many=True)
        emission_serializer.is_valid(raise_exception=True)
        emission_serializer.save()

    def _add_remarks(self, cp_report, section_data):
        cp_report.comment = section_data.get("remarks", "")
        cp_report.save()

    def _create_adm_records(self, cp_report, section_data, section):
        for record in section_data:
            record["country_programme_report_id"] = cp_report.id
            record["section"] = section
        record_serializer = AdmRecordSerializer(data=section_data, many=True)
        record_serializer.is_valid(raise_exception=True)
        record_serializer.save()

    def _create_report_info(self, cp_report, report_info_data):
        report_info_data["country_programme_report_id"] = cp_report.id
        report_info_serializer = CPReportInfoSerializer(data=report_info_data)
        report_info_serializer.is_valid(raise_exception=True)
        report_info_serializer.save()

    def _create_history(self, cp_report, request_user):
        history_data = {}
        history_data["country_programme_report_id"] = cp_report.id
        history_data["report_version"] = 1
        history_data["updated_by_id"] = request_user.id
        history_data["reporting_officer_name"] = cp_report.reporting_entry
        history_data["reporting_officer_email"] = cp_report.reporting_email
        history_data["event_description"] = "Created by user"

        cp_history_serializer = CPHistorySerializer(data=history_data)
        cp_history_serializer.is_valid(raise_exception=True)
        cp_history_serializer.save()

    def _add_comments(self, cp_report, comments):
        comments_data = []
        for section_name, section in COMMENT_SECTIONS.items():
            section_data = comments[section_name]
            if section_data is None:
                continue
            for key, comment_type in [
                ("country", CPComment.CPCommentType.COMMENT_COUNTRY),
                ("mlfs", CPComment.CPCommentType.COMMENT_SECRETARIAT),
            ]:
                comment = {}
                text = section_data.get(key)
                if not text:
                    continue
                comment["comment"] = text
                comment["comment_type"] = comment_type
                comment["section"] = section
                comment["country_programme_report_id"] = cp_report.id
                comments_data.append(comment)

        cp_comment_serializer = CPCommentSerializer(data=comments_data, many=True)
        cp_comment_serializer.is_valid(raise_exception=True)
        cp_comment_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        request_user = self.context["user"]

        cp_comments = {
            comment_section: validated_data.get(comment_section, None)
            for comment_section in COMMENT_SECTIONS
        }

        cp_report_info = validated_data.get("report_info", {})
        if cp_report_info is None:
            cp_report_info = {}

        cp_reporting = cp_report_info.get("country_programme_report", {})
        reporting_entry = cp_reporting.get(
            "reporting_entry", request_user.get_full_name()
        )
        reporting_email = cp_reporting.get("reporting_email", request_user.email)

        cp_report_data = {
            "name": validated_data.get("name"),
            "year": validated_data.get("year"),
            "status": validated_data.get("status", CPReport.CPReportStatus.DRAFT),
            "country_id": validated_data.get("country_id"),
        }

        cp_report_serializer = CPReportSerializer(data=cp_report_data)
        cp_report_serializer.is_valid(raise_exception=True)

        # add user
        cp_report_serializer.validated_data["created_by"] = request_user
        cp_report_serializer.validated_data["version_created_by"] = request_user

        cp_report = cp_report_serializer.save()
        cp_report.reporting_entry = reporting_entry
        cp_report.reporting_email = reporting_email
        cp_report.save()

        self._create_cp_records(cp_report, validated_data.get("section_a", []), "A")
        self._create_prices(cp_report, validated_data.get("section_c", []))

        if cp_report_data["year"] > IMPORT_DB_MAX_YEAR:
            self._create_cp_records(cp_report, validated_data.get("section_b", []), "B")
            self._create_generation(cp_report, validated_data.get("section_d", []))
            self._create_emission(cp_report, validated_data.get("section_e", []))
            self._add_remarks(cp_report, validated_data.get("section_f", {}))
            self._add_comments(cp_report, cp_comments)
        else:
            self._create_adm_records(cp_report, validated_data.get("adm_b", []), "B")
            self._create_adm_records(cp_report, validated_data.get("adm_c", []), "C")
            self._create_adm_records(cp_report, validated_data.get("adm_d", []), "D")

        if cp_report_info:
            self._create_report_info(cp_report, cp_report_info)

        if not self.context.get("from_update"):
            self._create_history(cp_report, request_user)
            if config.SEND_MAIL and cp_report.status == CPReport.CPReportStatus.FINAL:
                send_mail_report_create.delay(cp_report.id)  # send mail to MLFS

        return cp_report
