import { createContext } from 'react'

interface PermissionsContextProps {
  canViewBp: boolean
  canViewBpYears: boolean
  canViewActivities: boolean
  canUploadBp: boolean
  canValidateUploadBp: boolean
  canUpdateBp: boolean
  canExportBp: boolean
  canViewFiles: boolean
  canDownloadFiles: boolean
  canUploadFiles: boolean
  canDeleteFiles: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
