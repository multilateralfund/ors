import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

const PCRLessonsLearned = () => {
  const { pcrAgencies } = useContext(PCRDataContext)

  return <>Lessons learned</>
}

export default PCRLessonsLearned
