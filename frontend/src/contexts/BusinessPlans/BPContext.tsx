import { createContext } from 'react'

import { BPContextType } from './types'

const BPContext = createContext<BPContextType>(null as unknown as BPContextType)

export default BPContext
