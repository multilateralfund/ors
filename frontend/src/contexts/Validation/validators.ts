import type { IRow, UsageMapping } from './types'

export function validateTotals(row: IRow) {
  return (
    row.imports - row.exports + row.production ==
    row.record_usages.reduce((acc, usage) => acc + usage.quantity, 0)
  )
}

export function validateAnnexEQPS(row: IRow, usages: UsageMapping) {
  const usageQPS = usages['Methyl bromide QPS'].id
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueQPS = anyRow[`usage_${usageQPS}`] || 0
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0
  const valueImport = row.imports

  return isAnnexESubstance ? !!(valueQPS + valueNonQPS == valueImport) : true
}

export function validateAnnexENonQPS(row: IRow, usages: UsageMapping) {
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0

  return isAnnexESubstance && valueNonQPS
    ? !!(row.banned_date && row.remarks)
    : true
}

export function validateBannedImports(row: IRow) {
  const bannedByGroup =
    row.group.startsWith('Annex E') ||
    row.group.startsWith('Annex A, Group I') ||
    row.group.startsWith('Annex A, Group II') ||
    row.group.startsWith('Annex B, Group I') ||
    row.group.startsWith('Annex B, Group II') ||
    row.group.startsWith('Annex B, Group III')

  const isBanned = bannedByGroup && (row.substance_id || row.blend_id)
  return isBanned ? !!row.banned_date : true
}
