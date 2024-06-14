import type {
  GlobalValidatorFuncResult,
  IRow,
  IUsage,
  RowValidatorFuncContext,
  RowValidatorFuncResult,
  ValidationSchemaKeys,
} from './types'

export function validateUsageTotals(row: IRow): RowValidatorFuncResult {
  const isValid =
    row.imports - row.exports + row.production ==
    row.record_usages.reduce((acc, usage) => acc + usage.quantity, 0)
  if (!isValid && !row.remarks) {
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

export function validateAnnexENonQPSRemarks(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0

  if (isAnnexESubstance && valueNonQPS) {
    const isValid = row.remarks

    if (!isValid) {
      return { row: row.display_name }
    }
  }
}

export function validateAnnexENonQPSDate(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageNonQPS = usages['Methyl bromide Non-QPS'].id
  const isAnnexESubstance =
    row.group.startsWith('Annex E') && (row.substance_id || row.blend_id)

  const anyRow = row as unknown as Record<string, number>
  const valueNonQPS = anyRow[`usage_${usageNonQPS}`] || 0

  if (isAnnexESubstance && valueNonQPS) {
    const isValid = row.banned_date

    if (!isValid) {
      return { row: row.display_name }
    }
  }
}

export function validateBannedImportsRemarks(
  row: IRow,
  ctx: any,
): RowValidatorFuncResult {
  const bannedByGroup =
    row.group.startsWith('Annex A, Group I') ||
    row.group.startsWith('Annex A, Group II') ||
    row.group.startsWith('Annex B, Group I') ||
    row.group.startsWith('Annex B, Group II') ||
    row.group.startsWith('Annex B, Group III')

  const isBanned = bannedByGroup && (row.substance_id || row.blend_id)
  const hasUsages =
    sumUsages((row.record_usages as unknown as IUsage[]) || []) > 0
  const hasSomethingElse =
    row.imports || row.exports || row.production || row.import_quotas

  if (isBanned && (hasUsages || hasSomethingElse)) {
    if (!row.remarks) {
      return { row: row.display_name }
    }
  }
}

export function validateBannedImportsDate(row: IRow): RowValidatorFuncResult {
  const bannedByGroup =
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

  if (valueOther && (valueAC || valueRefrigeration)) {
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

function sumRowColumns(row: Record<string, any>, columns: string[]) {
  let result = 0

  for (let i = 0; i < columns.length; i++) {
    result += parseFloat(row[columns[i]]) || 0
  }
  return result
}

function sumNumbers(numbers: number[]): number {
  let result = 0

  for (let i = 0; i < numbers.length; i++) {
    result += numbers[i]
  }

  return result
}

function sumMaybeNumbers(numbers: (number | string)[]): number {
  let result = 0

  for (let i = 0; i < numbers.length; i++) {
    result += parseFloat(numbers[i] as string) || 0
  }

  return result
}

function sumUsages(usages: IUsage[]) {
  const quantites = new Array(usages.length)

  for (let i = 0; i < usages.length; i++) {
    quantites[i] = usages[i].quantity
  }

  return sumMaybeNumbers(quantites)
}

export function validateFacilityName(
  section_id: ValidationSchemaKeys,
  { form }: RowValidatorFuncContext,
): GlobalValidatorFuncResult {
  const sectionDColumns = ['all_uses', 'destruction', 'feedstock']
  const sectionDHasData =
    form.section_d.filter((dRow) => sumRowColumns(dRow, sectionDColumns))
      .length > 0

  const hasFacility =
    (form[section_id] as IRow[]).filter((row) => row.facility).length > 0

  if (sectionDHasData && !hasFacility) {
    return {}
  }
}

export function validatePrices(row: IRow): RowValidatorFuncResult {
  if ((row.current_year_price || row.previous_year_price) && !row.remarks) {
    return { highlight_cells: ['remarks'], row: row.display_name }
  }
}

export function validateSectionDTotals(
  row: IRow,
  { form }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const lTotal = sumRowColumns(row, ['all_uses', 'destruction', 'feedstock'])
  const eTotal = sumNumbers(
    form.section_e.flatMap((row) =>
      sumRowColumns(row, ['all_uses', 'destruction', 'feedstock_gc']),
    ),
  )

  if (eTotal && lTotal != eTotal) {
    const eA = sumNumbers(
      form.section_e.flatMap((row) => row.all_uses) as number[],
    )
    const eD = sumNumbers(
      form.section_e.flatMap((row) => row.destruction) as number[],
    )
    const eF = sumNumbers(
      form.section_e.flatMap((row) => row.feedstock_gc) as number[],
    )

    const highlight_cells = []
    if (row.all_uses != eA) {
      highlight_cells.push('all_uses')
    }
    if (row.destruction != eD) {
      highlight_cells.push('destruction')
    }
    if (row.feedstock != eF) {
      highlight_cells.push('feedstock')
    }

    return { highlight_cells, row: row.display_name }
  }
}
// export function validateSectionDFilled(
//   row: IRow,
//   { form }: RowValidatorFuncContext,
// ): RowValidatorFuncResult {
//   const lTotal = sumRowColumns(row, ['all_uses', 'destruction', 'feedstock'])
//
//   if (lTotal) {
//     const substances =
//       [form.section_a, form.section_b].flatMap((rows) =>
//         rows.filter((row) => {
//           const hasUsages =
//             sumUsages((row.record_usages as unknown as IUsage[]) || []) > 0
//           return (
//             (hasUsages && row.group?.startsWith('Annex C, Group I')) ||
//             row.group?.startsWith('Annex F')
//           )
//         }),
//       ).length > 0
//     if (!substances) {
//       const highlight_cells = ['all_uses', 'destruction', 'feedstock'].filter(
//         (name) => parseFloat((row as any)[name]),
//       )
//       return { highlight_cells, row: row.display_name }
//     }
//   }
// }

export function validateSectionBOther(
  row: IRow,
  { usages }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const usageOther = usages['Other'].id
  const valueOther = (row as any)[`usage_${usageOther}`] || 0
  if (valueOther && !row.remarks) {
    return { highlight_cells: ['remarks'], row: row.display_name }
  }
}

export function validateBlendComponents(
  row: IRow,
  { form }: RowValidatorFuncContext,
): RowValidatorFuncResult {
  const isBlend = !!row.blend_id

  const components = row.composition
    ?.split(';')
    .map((comp) =>
      comp
        .substring(0, comp.lastIndexOf(comp.includes('=') ? '=' : '-')) // CustMix has format like "CFC-11-50%", while other blends have format like "HCFC-22=60%"
        .trim(),
    )
    .filter((comp) => comp.startsWith('HCFC'))

  const substances = [form.section_a].flatMap((rows) =>
    rows
      .filter((row) => {
        const chemical_name =
          row.chemical_name || row.chemical_display_name || row.display_name
        return (
          components?.includes(chemical_name) &&
          sumUsages((row.record_usages as unknown as IUsage[]) || []) > 0
        )
      })
      .map(
        (row) =>
          row.chemical_name || row.chemical_display_name || row.display_name,
      ),
  )
  const allComponentsReported =
    components?.filter((comp) => substances.includes(comp)).length ==
    components?.length

  if (isBlend && !allComponentsReported) {
    return { row: row.display_name }
  }
}

export function validateHFC23(row: IRow): RowValidatorFuncResult {
  if (row.chemical_name === 'HFC-23') {
    const hasUsages = sumUsages(row.record_usages) > 0
    const hasExtra =
      sumMaybeNumbers([row.manufacturing_blends || 0, row.import_quotas]) > 0

    if (hasUsages || hasExtra) {
      const highlight_cells = [
        hasExtra
          ? ['manufacturing_blends', 'import_quotas'].filter(
              (name) => (row as any)[name],
            )
          : [],
        hasUsages
          ? Object.keys(row).filter(
              (key) => key.startsWith('usage_') && (row as any)[key],
            )
          : [],
      ].flat()
      return { highlight_cells, row: row.display_name }
    }
  }
}
