import type {
  CPValidationForm,
  IGlobalValidationResult,
  IRow,
  IRowValidationResult,
  UsageMapping,
  ValidateSectionResult,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

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
  form: CPValidationForm,
) {
  const result: IRowValidationResult[] = []

  const rowValidators = validationSchema[section_id]?.rows || []
  const shouldValidateRow =
    validationSchema[section_id]?.shouldValidateRow || (() => true)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    for (let j = 0; j < rowValidators.length; j++) {
      if (shouldValidateRow(row)) {
        const { highlight_cells, validator, ...validatorProps } =
          rowValidators[j]
        const invalidResult = validator(row, { form, usages })
        if (invalidResult) {
          result.push({
            ...validatorProps,
            ...invalidResult,
            highlight_cells: [
              ...(invalidResult.highlight_cells || []),
              ...Object.keys(highlight_cells).filter((key) =>
                highlight_cells[key](row),
              ),
            ],
            row_id: row.row_id,
          })
        }
      }
    }
  }

  return result
}

function validateSectionGlobal(
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
  form: CPValidationForm,
): IGlobalValidationResult[] {
  const sectionValidators = validationSchema?.[section_id]?.global || []

  const result = []

  for (let i = 0; i < sectionValidators.length; i++) {
    const { validator, ...validatorProps } = sectionValidators[i]
    const invalidResult = validator(section_id, { form, usages })
    if (invalidResult) {
      result.push({ ...validatorProps, ...invalidResult })
    }
  }

  return result
}

function validateSection(
  form: CPValidationForm,
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
): ValidateSectionResult {
  const rowErrors = validateSectionRows(
    form[section_id] as IRow[],
    section_id,
    usages,
    form,
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

  const globalErrors = validateSectionGlobal(section_id, usages, form)

  return {
    global: globalErrors,
    hasErrors: hasRowErrors || !!globalErrors.length,
    rows: rowErrors,
  }
}

export default function validateForm(
  form: CPValidationForm,
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
