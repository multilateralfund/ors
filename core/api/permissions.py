from rest_framework import permissions


class HasReplenishmentViewPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_replenishment_view_access")


class HasReplenishmentEditPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_replenishment_edit_access")


class HasCPReportViewPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_cp_report_view_access")


class HasCPReportEditPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_cp_report_edit_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the object

        If the object does not have a country_id attribute, return True.
        Else check if the user's country_id matches the object's country_id.

        """
        if getattr(obj, "country_id", "no attr") == "no attr":
            return True

        if request.user.has_perm("core.can_view_all_countries"):
            return True

        if request.user.has_perm("core.can_view_only_own_country"):
            if request.user.country_id == obj.country_id:
                return True

        return False


class HasCPReportDeletePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_cp_report_delete_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the object

        If the object does not have a country_id attribute, return True.
        Else check if the user's country_id matches the object's country_id.

        """
        if getattr(obj, "country_id", "no attr") == "no attr":
            return True

        if request.user.has_perm("core.can_view_all_countries"):
            return True

        if request.user.has_perm("core.can_view_only_own_country"):
            if request.user.country_id == obj.country_id:
                return True

        return False


class HasCPReportExportPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("core.has_cp_report_export_access")


class HasMetaProjectsViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view meta projects.
        """
        return request.user.has_perm("core.has_meta_projects_view_access")


class HasProjectMetaInfoViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project metadata.
        """
        return request.user.has_perm("core.has_project_metainfo_view_access")


class HasProjectStatisticsViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_statistics_view_access")


class HasProjectV2ViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_v2_view_access")


class HasProjectV2EditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_v2_edit_access")


class HasProjectV2EditPlusV3Access(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm(
            "core.has_project_v2_edit_access"
        ) or request.user.has_perm("core.has_project_v2_version3_edit_access")


class HasEnterpriseViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view enterprise data.
        """
        return request.user.has_perm("core.has_enterprise_view_access")


class HasEnterpriseEditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to edit enterprise data.
        """
        return request.user.has_perm("core.has_enterprise_edit_access")


class HasEnterpriseApprovalAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to approve(change status) enterprise data.
        """
        return request.user.has_perm("core.has_enterprise_approval_access")


class HasProjectEnterpriseEditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to edit project enterprise data.
        """
        return request.user.has_perm("core.has_project_enterprise_edit_access")


class HasProjectEnterpriseApprovalAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to approve project enterprise data.
        """
        return request.user.has_perm("core.has_project_enterprise_approval_access")


class HasProjectSettingsAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view and edit project settings.
        """
        return request.user.has_perm("core.has_project_settings_access")


class HasProjectViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_view_access")


class HasProjectEditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_edit_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the object

        If the object does not have an agency_id attribute, return True.
        Else check if the user's agency_id matches the object's agency_id.

        """
        if getattr(obj, "agency_id", "no attr") == "no attr":
            return True

        if request.user.has_perm("core.can_view_all_agencies"):
            return True

        if request.user.has_perm("core.can_view_only_own_agency"):
            if request.user.agency_id == obj.agency_id:
                return True
        return False


class HasAPRViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view APR data.
        Works on all APR-related objects.
        """
        return request.user.has_perm("core.has_apr_view_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user can access the agency report.
        Agency users can only access their own agency's reports.
        """
        # Get the agency report (handle both direct and nested objects)
        if hasattr(obj, "report"):
            # Checking for an AnnualProjectReport or File
            agency_report = obj.report
        else:
            # AnnualAgencyProjectReport
            agency_report = obj

        # TODO: is this permission enough to say "this is an MLFS user"?
        if request.user.has_perm("core.can_view_all_agencies"):
            return True

        # Agency users can only access their own agency's data
        if request.user.has_perm("core.can_view_only_own_agency"):
            if not hasattr(request.user, "agency") or not request.user.agency:
                return False

            if (
                hasattr(agency_report, "agency_id")
                and request.user.agency_id == agency_report.agency_id
            ):
                return True

        return False


class HasAPREditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to edit Annual Project Reports.
        """

        return request.user.has_perm("core.has_apr_edit_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user can edit the agency report.
        Agency users can only edit their own agency's reports
        """
        if hasattr(obj, "report"):
            agency_report = obj.report
        else:
            agency_report = obj

        if request.user.has_perm("core.can_view_all_agencies"):
            return True

        # Agency users can only edit their own agency's editable reports
        if request.user.has_perm("core.can_view_only_own_agency"):
            # Check user has agency and it matches
            if not hasattr(request.user, "agency") or not request.user.agency:
                return False

            if (
                hasattr(agency_report, "agency_id")
                and request.user.agency_id == agency_report.agency_id
            ):
                return True

        return False


class HasAPRSubmitAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to submit Annual Project Reports.
        """

        return request.user.has_perm("core.has_apr_submit_access")

    def has_object_permission(self, request, view, obj):
        """
        Check if user can submit the agency report.
        Agency users can only submit their own agency's reports
        """
        if hasattr(obj, "report"):
            agency_report = obj.report
        else:
            agency_report = obj

        # TODO: we should let MLFS users submit, right?
        if request.user.has_perm("core.can_view_all_agencies"):
            return True

        if request.user.has_perm("core.can_view_only_own_agency"):
            if not hasattr(request.user, "agency") or not request.user.agency:
                return False

            if (
                hasattr(agency_report, "agency_id")
                and request.user.agency_id == agency_report.agency_id
            ):
                return True

        return False


class HasMLFSFullAccess(permissions.BasePermission):
    """
    Permission for MLFS Full Access users (unlock, endorse, edit all).
    """

    def has_permission(self, request, view):
        return request.user.has_perm(
            "core.has_apr_edit_access"
        ) and request.user.has_perm("core.can_view_all_agencies")


class HasProjectV2SubmitAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view project statistics.
        """
        return request.user.has_perm("core.has_project_v2_submit_access")


class HasProjectV2RecommendAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to recommend projects in Project V2.
        """
        return request.user.has_perm("core.has_project_v2_recommend_projects_access")


class HasProjectV2MyaAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to manage MYA in Project V2.
        """
        return request.user.has_perm("core.has_project_v2_mya_access")


class HasProjectV2TransferAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to transfer projects in Project V2.
        """
        return request.user.has_perm("core.has_project_v2_transfer_projects_access")


class HasProjectV2ApproveAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to approve/reject projects in Project V2.
        """
        return request.user.has_perm("core.has_project_v2_approve_projects_access")


class HasProjectV2AssociateProjectsAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to associate projects in Project V2.
        """
        return request.user.has_perm("core.has_project_v2_associate_projects_access")


class HasBusinessPlanEditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to edit business plans.
        """
        return request.user.has_perm("core.has_business_plan_edit_access")


class HasBusinessPlanViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view business plans.
        """
        return request.user.has_perm("core.has_business_plan_view_access")


class HasSectorsAndSubsectorsViewAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to view sectors and subsectors.
        """
        return request.user.has_perm("core.has_sectors_and_subsectors_view_access")


class HasSectorsAndSubsectorsEditAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has permission to edit sectors and subsectors.
        """
        return request.user.has_perm("core.has_sectors_and_subsectors_edit_access")


class DenyAll(permissions.BasePermission):
    def has_permission(self, request, view):
        return False
