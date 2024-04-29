import type {
  IRow,
  RowValidatorFuncContext,
  RowValidatorFuncResult,
} from './types'

export function validateTotals(row: IRow): RowValidatorFuncResult {
  const isValid =
    row.imports - row.exports + row.production ==
    row.record_usages.reduce((acc, usage) => acc + usage.quantity, 0)
  if (!isValid) {
    return { row: row.display_name }
  }
}

export function validateAnnexEQPS(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageQPS = usages['Methyl bromide QPS'].id
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueQPS = anyRow[`usage_${usageQPS}`] || 0
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0
  const valueImport = row.imports

  if (isAnnexESubstance) {
    const isValid = valueQPS + valueNonQPS == valueImport

    if (!isValid) {
      return { row: row.display_name }
    }
  }
}

export function validateAnnexENonQPS(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0

  if (isAnnexESubstance && valueNonQPS) {
    const isValid = row.banned_date && row.remarks

    if (!isValid) {
      return { row: row.display_name }
    }
  }
}

export function validateBannedImports(row: IRow): RowValidatorFuncResult {
  const bannedByGroup =
    row.group.startsWith('Annex E') ||
    row.group.startsWith('Annex A, Group I') ||
    row.group.startsWith('Annex A, Group II') ||
    row.group.startsWith('Annex B, Group I') ||
    row.group.startsWith('Annex B, Group II') ||
    row.group.startsWith('Annex B, Group III')

  const isBanned = bannedByGroup && (row.substance_id || row.blend_id)

  if (isBanned) {
    if (!row.banned_date) {
      return { row: row.display_name }
    }
  }
}

export function validateOtherUnidentifiedManufacturing(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageRefrigeration =
    usages['Refrigeration Manufacturing Refrigeration'].id
  const usageAC = usages['Refrigeration Manufacturing AC'].id
  const usageOther = usages['Refrigeration Manufacturing Other'].id

  const anyRow = row as unknown as Record<string, number>

  const valueRefrigeration = anyRow[`usage_${usageRefrigeration}`] || 0
  const valueAC = anyRow[`usage_${usageAC}`] || 0
  const valueOther = anyRow[`usage_${usageOther}`] || 0

  if (valueRefrigeration && (valueAC || valueOther)) {
    return { highlight_cells: [`usage_${usageOther}`], row: row.display_name }
  }
}

export function validateUncommonSubstance(row: IRow): RowValidatorFuncResult {
  const hasUsage = row.record_usages.length > 0
  const hasSomethingElse =
    row.imports ||
    row.exports ||
    row.production ||
    row.manufacturing_blends ||
    row.import_quotas ||
    row.banned_date ||
    row.remarks

  if (row.chemical_note && (hasUsage || hasSomethingElse)) {
    return { row: row.display_name }
  }
}

export function validateFacilityName(
  row: IRow,
  { form }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const sectionDColumns = ['all_uses', 'destruction', 'feedstock']
  const sectionDHasData =
    form.section_d.filter((dRow) =>
      sectionDColumns.reduce((acc: number, val: string) => {
        acc += parseFloat(dRow[val]) || 0
        return acc
      }, 0),
    ).length > 0
  if (sectionDHasData && !row.facility) {
    return { row: 'Facility name' }
  }
}
