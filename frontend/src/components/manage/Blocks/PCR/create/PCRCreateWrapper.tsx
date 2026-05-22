import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'

import { Redirect } from 'wouter'

const PCRCreateWrapper = () => {
  const { canEditPCR } = useContext(PermissionsContext)

  if (!canEditPCR) {
    return <Redirect to="/pcr" />
  }

  return <>create</>
}

export default PCRCreateWrapper
