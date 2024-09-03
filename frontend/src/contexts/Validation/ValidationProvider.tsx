import type {
  IValidationProvider,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { memo, useState } from 'react'

import ValidationDrawer from '@ors/components/ui/ValidationDrawer/ValidationDrawer'
import useApi from '@ors/hooks/useApi'

import ValidationContext from './ValidationContext'
import validateForm from './validateForm'

function hasErrors(
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>,
) {
  let result = false

  const errorValues = Object.values(errors)
  for (let i = 0; i < errorValues.length; i++) {
    if (errorValues[i].hasErrors) {
      result = true
      break
    }
  }

  return result
}

const ValidationProvider = (props: IValidationProvider) => {
  const { children, form, model, silent = false } = props

  const [openDrawer, setOpenDrawer] = useState(false)

  const usagesApi = useApi<ApiUsage[]>({
    options: {},
    path: '/api/usages/',
  })

  const enableValidation = ['V'].includes(model || '')

  const errors =
    enableValidation && usagesApi.loaded && usagesApi.data
      ? validateForm(form, usagesApi.data)
      : ({} as Record<ValidationSchemaKeys, ValidateSectionResult>)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpenDrawer(newOpen)
  }

  console.log('REVALIDATE')

  return (
    <ValidationContext.Provider
      value={{
        errors: errors,
        hasErrors: hasErrors(errors),
        setOpenDrawer,
        silent,
      }}
    >
      <ValidationDrawer
        errors={errors}
        isOpen={openDrawer}
        onClose={toggleDrawer(false)}
      />
      {children}
    </ValidationContext.Provider>
  )
}

export default memo(ValidationProvider)
