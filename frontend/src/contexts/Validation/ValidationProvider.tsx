import type {
  IValidationProvider,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { useState } from 'react'

import ValidationDrawer from '@ors/components/ui/ValidationDrawer/ValidationDrawer'
import useApi from '@ors/hooks/useApi'

import ValidationContext from './ValidationContext'
import validateForm from './validateForm'

const ValidationProvider = (props: IValidationProvider) => {
  const { children, form, model } = props

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
  return (
    <ValidationContext.Provider
      value={{
        errors: errors,
        setOpenDrawer,
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

export default ValidationProvider
