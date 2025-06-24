import { createContext } from 'react'

interface PermissionsContextProps {
  canViewBp: boolean
  canUpdateBp: boolean
}

const PermissionsContext = createContext<PermissionsContextProps>(
  null as unknown as PermissionsContextProps,
)

export default PermissionsContext
