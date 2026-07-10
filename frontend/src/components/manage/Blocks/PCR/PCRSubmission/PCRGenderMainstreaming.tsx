import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

const PCRGenderMainstreaming = () => {
  const { pcrAgencies } = useContext(PCRDataContext)

  return <>Gender mainstreaming</>
}

export default PCRGenderMainstreaming
