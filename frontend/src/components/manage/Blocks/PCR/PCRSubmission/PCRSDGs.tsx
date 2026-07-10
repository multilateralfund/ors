import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

const PCRSDGs = () => {
  const { pcrAgencies } = useContext(PCRDataContext)

  return <>SDGs (optional)</>
}

export default PCRSDGs
