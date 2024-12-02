import type {
  IGlobalValidationResult,
  IUsage,
  ValidateSectionResult,
  ValidateSectionResultValue,
  ValidationSchemaKeys,
} from '@ors/contexts/Validation/types'

import { sumMaybeNumbers } from '@ors/helpers/Utils/Utils'

export { sumMaybeNumbers }

export function extractSectionErrors(vResult: ValidateSectionResult) {
  const result = vResult ? [...vResult.global] : []
  if (vResult.hasErrors) {
    const rowData = Object.values(
      vResult.rows,
    ) as ValidateSectionResultValue[][]
    for (let i = 0; i < rowData.length; i++) {
      for (let j = 0; j < rowData[i].length; j++) {
        result.push(rowData[i][j])
      }
    }
  }
  return result
}

export function extractErrors(
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>,
) {
  const result: {
    errors: IGlobalValidationResult[] | ValidateSectionResultValue[]
    section_id: ValidationSchemaKeys
  }[] = []
  const eKeys = Object.keys(errors) as ValidationSchemaKeys[]

  for (let i = 0; i < eKeys.length; i++) {
    const sectionId = eKeys[i]
    const sectionErrors = extractSectionErrors(errors[sectionId])
    if (sectionErrors.length) {
      result.push({ errors: sectionErrors, section_id: sectionId })
    }
  }

  return result
}

export function sumRowColumns(row: Record<string, any>, columns: string[]) {
  let result = 0

  for (let i = 0; i < columns.length; i++) {
    result += parseFloat(row[columns[i]]) || 0
  }
  return result
}

export function sumNumbers(numbers: number[]): number {
  let result = 0

  for (let i = 0; i < numbers.length; i++) {
    result += numbers[i]
  }

  return result
}

export function sumUsages(usages: IUsage[]) {
  const quantites = new Array(usages.length)

  for (let i = 0; i < usages.length; i++) {
    quantites[i] = usages[i].quantity
  }

  return sumMaybeNumbers(quantites)
}
