import { createContext } from 'react'

import { IValidationContext } from './types'

const ValidationContext = createContext(null as unknown as IValidationContext)

export default ValidationContext
