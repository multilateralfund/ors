import { IHandleClearInputChange, IHandleInputChange } from '../types'

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
  const value = evt.target.value
  const parsedValue = parseFloat(value)
  if (
    value === '' ||
    (typeof parsedValue === 'number' && !isNaN(parsedValue))
  ) {
    setFormState((prev: any) => ({ ...prev, [name]: value }))
  }
}

export const handleClearSelect: IHandleClearInputChange = (
  setFormState,
  name,
) => setFormState((prev: any) => ({ ...prev, [name]: null }))
