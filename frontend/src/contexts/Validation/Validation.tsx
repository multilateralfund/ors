import type {
  IRow,
  IRowValidationResult,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'

import { createContext } from 'react'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import validationSchema from './validationSchema'

function validateSectionRows(rows: IRow[]) {
  return rows
    .flatMap((row) =>
      validationSchema.section_a?.rows?.map((rowValidator) => {
        const { highlight_cells, validator, ...validatorProps } = rowValidator
        const isValid = validator(row)
        if (!isValid) {
          return {
            ...validatorProps,
            highlight_cells: Object.keys(highlight_cells).filter((key) =>
              highlight_cells[key](row),
            ),
            row_id: row.row_id,
          }
        }
      }),
    )
    .filter((val) => val != undefined) as IRowValidationResult[]
}

function validateSection(section: IRow[]): ValidateSectionResult {
  const rowErrors = validateSectionRows(section).reduce(
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
export interface ValidationContextProps {
  // setForm: (form: CPBaseForm) => void
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
}

export const ValidationContext = createContext(
  null as unknown as ValidationContextProps,
)

export const ValidationProvider = (props: {
  children: React.ReactNode
  form: CPBaseForm
}) => {
  const { children, form } = props

  const validationSchemaKeys = Object.keys(
    validationSchema,
  ) as ValidationSchemaKeys[]

  console.log('running validation...')

  const errors = validationSchemaKeys.reduce(
    (acc, section_id) => {
      acc[section_id] = validateSection(form[section_id] as IRow[])
      return acc
    },
    {} as Record<ValidationSchemaKeys, ValidateSectionResult>,
  )

  return (
    <ValidationContext.Provider
      value={{
        errors: errors,
      }}
    >
      {children}
    </ValidationContext.Provider>
  )
}
