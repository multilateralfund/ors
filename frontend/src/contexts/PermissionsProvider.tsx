import { PropsWithChildren } from 'react'

import PermissionsContext from './PermissionsContext'
import { useStore } from '@ors/store'

interface PermissionsProviderProps extends PropsWithChildren {}

const PermissionsProvider = (props: PermissionsProviderProps) => {
  const { children } = props

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []
  const user_permissions_as_set = new Set(user_permissions)

  const canViewCPReports = user_permissions.includes(
    'has_cp_report_view_access',
  )
  const canEditCPReports = user_permissions.includes(
    'has_cp_report_edit_access',
  )
  const canSubmitFinalCPReport = user_permissions.includes(
    'can_submit_final_cp_version',
  )
  const canDeleteCPReports = user_permissions.includes(
    'has_cp_report_delete_access',
  )
  const canExportCPReports = user_permissions.includes(
    'has_cp_report_export_access',
  )

  const canViewBp = user_permissions.includes('has_business_plan_view_access')
  const canUpdateBp = user_permissions.includes('has_business_plan_edit_access')

  const canViewProjects = user_permissions.includes(
    'has_project_v2_view_access',
  )
  const canViewMetainfoProjects = user_permissions.includes(
    'has_project_metainfo_view_access',
  )
  const canViewSectorsSubsectors = user_permissions.includes(
    'has_sectors_and_subsectors_view_access',
  )
  const canUpdateProjects = user_permissions.includes(
    'has_project_v2_edit_access',
  )
  const canSubmitProjects = user_permissions.includes(
    'has_project_v2_submit_access',
  )
  const canRecommendProjects = user_permissions.includes(
    'has_project_v2_recommend_projects_access',
  )
  const canAssociateProjects = user_permissions.includes(
    'has_project_v2_associate_projects_access',
  )
  const canEditApprovedProjects = user_permissions.includes(
    'has_project_v2_edit_approved_access',
  )

  const canCommentCPCountry = user_permissions.includes(
    'can_cp_country_type_comment',
  )

  const canCommentCPSecretariat = user_permissions.includes(
    'can_cp_secretariat_type_comment',
  )

  const isCPCountryUserType = new Set([
    'can_view_only_own_country',
    'has_cp_report_view_access',
  ]).isSubsetOf(user_permissions_as_set)

  const canViewReplenishment = user_permissions.includes(
    'has_replenishment_view_access',
  )
  const canEditReplenishment = user_permissions.includes(
    'has_replenishment_edit_access',
  )

  const canEditProjects =
    canViewProjects &&
    (canUpdateProjects ||
      canSubmitProjects ||
      canRecommendProjects ||
      canEditApprovedProjects)

  return (
    <PermissionsContext.Provider
      value={{
        canViewCPReports,
        canEditCPReports,
        canSubmitFinalCPReport,
        canDeleteCPReports,
        canExportCPReports,
        canViewBp,
        canUpdateBp,
        canViewReplenishment,
        canEditReplenishment,
        canViewProjects,
        canViewMetainfoProjects,
        canViewSectorsSubsectors,
        canUpdateProjects,
        canSubmitProjects,
        canRecommendProjects,
        canAssociateProjects,
        canEditProjects,
        canEditApprovedProjects,
        canCommentCPCountry,
        canCommentCPSecretariat,
        isCPCountryUserType,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export default PermissionsProvider
