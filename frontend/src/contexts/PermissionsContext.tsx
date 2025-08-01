import { createContext } from 'react'

interface PermissionsContextProps {
  canViewCPReports: boolean
  canEditCPReports: boolean
  canSubmitFinalCPReport: boolean
  canDeleteCPReports: boolean
  canExportCPReports: boolean
  canViewBp: boolean
  canUpdateBp: boolean
  canViewProjects: boolean
  canViewMetainfoProjects: boolean
  canViewSectorsSubsectors: boolean
  canUpdateProjects: boolean
  canSubmitProjects: boolean
  canRecommendProjects: boolean
  canAssociateProjects: boolean
  canEditProjects: boolean
  canEditApprovedProjects: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
