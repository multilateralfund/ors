import { PropsWithChildren } from 'react'

import PermissionsContext from './PermissionsContext'
import { useStore } from '@ors/store'

interface PermissionsProviderProps extends PropsWithChildren {}

const PermissionsProvider = (props: PermissionsProviderProps) => {
  const { children } = props

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const canViewBp = user_permissions.includes('has_business_plan_view_access')
  const canUpdateBp = user_permissions.includes('has_business_plan_edit_access')

  const canViewProjects = user_permissions.includes(
    'has_project_v2_view_access',
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
  const canEditProjects =
    canUpdateProjects || canSubmitProjects || canRecommendProjects

  return (
    <PermissionsContext.Provider
      value={{
        canViewBp,
        canUpdateBp,
        canViewProjects,
        canUpdateProjects,
        canSubmitProjects,
        canRecommendProjects,
        canAssociateProjects,
        canEditProjects,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export default PermissionsProvider
