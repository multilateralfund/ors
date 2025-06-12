import { PropsWithChildren } from 'react'

import PermissionsContext from './PermissionsContext'
import { useStore } from '@ors/store'

interface PermissionsProviderProps extends PropsWithChildren {}

const PermissionsProvider = (props: PermissionsProviderProps) => {
  const { children } = props

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const canViewBp = user_permissions.includes('view_business_plan')
  const canViewBpYears = user_permissions.includes(
    'view_business_plan_get_years',
  )
  const canViewActivities = user_permissions.includes(
    'view_business_plan_activity',
  )

  const canUploadBp = user_permissions.includes('upload_business_plan')
  const canValidateUploadBp = user_permissions.includes(
    'upload-validate_business_plan',
  )
  const canUpdateBp = user_permissions.includes('update_business_plan')
  const canExportBp = user_permissions.includes('export_bp_activity')

  const canViewFiles = user_permissions.includes('retrieve_bp_file')
  const canDownloadFiles = user_permissions.includes('download_bp_file')
  const canUploadFiles = user_permissions.includes('upload_bp_file')
  const canDeleteFiles = user_permissions.includes('delete_bp_file')

  return (
    <PermissionsContext.Provider
      value={{
        canViewBp,
        canViewBpYears,
        canViewActivities,
        canUploadBp,
        canValidateUploadBp,
        canUpdateBp,
        canExportBp,
        canViewFiles,
        canDownloadFiles,
        canUploadFiles,
        canDeleteFiles,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export default PermissionsProvider
