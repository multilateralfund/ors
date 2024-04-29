import type {
  IRow,
  IRowValidationResult,
  UsageMapping,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

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

export default function validateForm(
  form: CPBaseForm,
  usageApiData: ApiUsage[],
) {
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
