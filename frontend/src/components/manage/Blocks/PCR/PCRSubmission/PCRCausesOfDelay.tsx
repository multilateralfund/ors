import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

const PCRCausesOfDelay = () => {
  const { pcrAgencies } = useContext(PCRDataContext)

  return <>Causes of delay</>
}

export default PCRCausesOfDelay
