import type {
  IGlobalValidationResult,
  ValidateSectionResult,
  ValidateSectionResultValue,
  ValidationSchemaKeys,
} from '@ors/contexts/Validation/types'

export function extractSectionErrors(vResult: ValidateSectionResult) {
  const result = [...vResult.global] || []
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
