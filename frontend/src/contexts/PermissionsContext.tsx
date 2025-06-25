import { createContext } from 'react'

interface PermissionsContextProps {
  canViewBp: boolean
  canUpdateBp: boolean
  canViewProjects: boolean
  canUpdateProjects: boolean
  canAssociateProjects: boolean
  canSubmitProjects: boolean
  canRecommendProjects: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
