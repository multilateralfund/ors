import { createContext } from 'react'

interface PermissionsContextProps {
  canViewBp: boolean
  canUpdateBp: boolean
  canViewProjects: boolean
  canUpdateProjects: boolean
  canSubmitProjects: boolean
  canRecommendProjects: boolean
  canAssociateProjects: boolean
  canEditProjects: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
