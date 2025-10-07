import { createContext } from 'react'

interface PermissionsContextProps {
  canViewCPReports: boolean
  canEditCPReports: boolean
  canSubmitFinalCPReport: boolean
  canDeleteCPReports: boolean
  canExportCPReports: boolean
  canViewBp: boolean
  canUpdateBp: boolean
  canViewReplenishment: boolean
  canEditReplenishment: boolean
  canViewV1Projects: boolean
  canViewProjects: boolean
  canViewMetainfoProjects: boolean
  canViewSectorsSubsectors: boolean
  canUpdateProjects: boolean
  canUpdateV3Projects: boolean
  canSubmitProjects: boolean
  canRecommendProjects: boolean
  canApproveProjects: boolean
  canAssociateProjects: boolean
  canEditProjects: boolean
  canEditApprovedProjects: boolean
  canViewProductionProjects: boolean
  canViewEnterprises: boolean
  canEditEnterprise: boolean
  canApproveEnterprise: boolean
  canEditProjectEnterprise: boolean
  canApproveProjectEnterprise: boolean
  canSetProjectSettings: boolean
  canCommentCPCountry: boolean
  canCommentCPSecretariat: boolean
  isCPCountryUserType: boolean
  isBpAdmin: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
