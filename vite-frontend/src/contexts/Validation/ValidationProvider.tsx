import type {
  IValidationProvider,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { memo, useCallback, useMemo, useState } from 'react'

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
  const { activeSection, children, form, model, silent = false } = props

  const [openDrawer, setOpenDrawer] = useState(false)

  const usagesApi = useApi<ApiUsage[]>({
    options: {},
    path: '/api/usages/',
  })

  const enableValidation = ['V'].includes(model || '')

  const errors = useMemo(
    () =>
      enableValidation && usagesApi.loaded && usagesApi.data
        ? validateForm(form, usagesApi.data)
        : ({} as Record<ValidationSchemaKeys, ValidateSectionResult>),
    [enableValidation, form, usagesApi.data, usagesApi.loaded],
  )

  const toggleDrawer = useCallback(
    (newOpen: boolean) => () => {
      setOpenDrawer(newOpen)
    },
    [],
  )

  const retVal = useMemo(
    () => ({
      errors: errors,
      hasErrors: hasErrors(errors),
      setOpenDrawer,
      silent,
    }),
    [errors, silent],
  )

  return (
    <ValidationContext.Provider value={retVal}>
      <ValidationDrawer
        activeSection={activeSection}
        errors={errors}
        isOpen={openDrawer}
        onClose={toggleDrawer(false)}
      />
      {children}
    </ValidationContext.Provider>
  )
}

export default memo(ValidationProvider)
