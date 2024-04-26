import type {
  IRow,
  IRowValidationResult,
  UsageMapping,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { createContext, useState } from 'react'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import ValidationDrawer from '@ors/components/ui/ValidationDrawer/ValidationDrawer'
import useApi from '@ors/hooks/useApi'

import validationSchema from './validationSchema'

function usageMapping(usages: ApiUsage[]): UsageMapping {
  return usages.reduce((acc, usage) => {
    acc[usage.full_name] = usage
    return acc
  }, {} as UsageMapping)
}

function validateSectionRows(
  rows: IRow[],
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
) {
  return rows
    .flatMap((row) =>
      validationSchema[section_id]?.rows?.map((rowValidator) => {
        const { highlight_cells, validator, ...validatorProps } = rowValidator
        const invalidResult = validator(row, usages)
        if (invalidResult) {
          return {
            ...validatorProps,
            highlight_cells: Object.keys(highlight_cells).filter((key) =>
              highlight_cells[key](row),
            ),
            row_id: row.row_id,
            ...invalidResult,
          }
        }
      }),
    )
    .filter((val) => val != undefined) as IRowValidationResult[]
}

function validateSection(
  form: CPBaseForm,
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
): ValidateSectionResult {
  const rowErrors = validateSectionRows(
    form[section_id] as IRow[],
    section_id,
    usages,
  ).reduce(
    (acc: Record<string, Omit<IRowValidationResult, 'row_id'>[]>, val) => {
      const { row_id, ...rest } = val
      if (!acc[row_id]) {
        acc[row_id] = []
      }
      acc[row_id].push(rest)
      return acc
    },
    {},
  )
  const hasRowErrors = !!Object.keys(rowErrors).length
  const globalErrors = hasRowErrors
    ? [
        {
          id: 'section-validation',
          message: 'This section contains incomplete or invalid data.',
        },
      ]
    : []
  return {
    global: globalErrors,
    hasErrors: hasRowErrors || !!globalErrors.length,
    rows: rowErrors,
  }
}

function applyValidationSchema(form: CPBaseForm, usageApiData: ApiUsage[]) {
  const validationSchemaKeys = Object.keys(
    validationSchema,
  ) as ValidationSchemaKeys[]

  return validationSchemaKeys.reduce(
    (acc, section_id) => {
      acc[section_id] = validateSection(
        form,
        section_id,
        usageMapping(usageApiData),
      )
      return acc
    },
    {} as Record<ValidationSchemaKeys, ValidateSectionResult>,
  )
}

export interface ValidationContextProps {
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>
}

export const ValidationContext = createContext(
  null as unknown as ValidationContextProps,
)

export const ValidationProvider = (props: {
  children: React.ReactNode
  form: CPBaseForm
  model?: string
}) => {
  const { children, form, model } = props

  const [openDrawer, setOpenDrawer] = useState(false)

  const usagesApi = useApi<ApiUsage[]>({
    options: {},
    path: '/api/usages/',
  })

  const enableValidation = ['V'].includes(model || '')

  const errors =
    enableValidation && usagesApi.loaded && usagesApi.data
      ? applyValidationSchema(form, usagesApi.data)
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
