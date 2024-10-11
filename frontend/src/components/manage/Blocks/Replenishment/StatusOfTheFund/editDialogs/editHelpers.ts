import { IHandleInputChange } from '../types'

export const handleInputChange: IHandleInputChange = (
  evt,
  setFormState,
  name,
) => {
  const value = evt.target.value
  setFormState((prev: any) => ({ ...prev, [name]: value }))
}

export const handleNumberInputChange: IHandleInputChange = (
  evt,
  setFormState,
  name,
) => {
  const value = parseFloat(evt.target.value)
  if (evt.target.value === '' || (typeof value === 'number' && !isNaN(value))) {
    setFormState((prev: any) => ({ ...prev, [name]: value }))
  }
}
