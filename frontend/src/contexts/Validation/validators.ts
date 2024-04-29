import type { IRow, RowValidatorFuncResult, UsageMapping } from './types'

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
  usages: UsageMapping,
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
  usages: UsageMapping,
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
