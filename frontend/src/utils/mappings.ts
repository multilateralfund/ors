import { SectionsType, TableColumnType } from '@/types/Reports'

export const usagesSectionA = [
  'Aerosol',
  'Foam',
  'Fire fighting',
  'Refrigeration',
  'Solvent',
  'Process agent',
  'Lab use',
  'Methyl bromide',
]
export const usagesSectionB = [
  'Aerosol',
  'Foam',
  'Fire fighting',
  'Refrigeration',
  'Solvent',
  'Process agent',
  'Lab use',
  'Methyl bromide',
]

export const mappingTabsWithSections: Record<number | string, SectionsType> = {
  0: {
    label: 'Section A',
    key: 'A',
    usages: usagesSectionA,
    substances: ['A/I', 'A/II', 'B/I', 'B/II', 'C/I', 'C/II'],
  },
  1: {
    label: 'Section B',
    key: 'B',
    usages: usagesSectionB,
    substances: ['F'],
  },
  2: { label: 'Section C', key: 'C' },
  3: { label: 'Section D', key: 'D' },
  4: { label: 'Section E', key: 'E' },
  5: { label: 'Section F', key: 'F' },
}

export const mappingColumnsWithState = (
  sectionId: number,
  defaultColumns: any[] = [],
) => {
  const mappingTableColumns: Record<
    number,
    TableColumnType<{
      substance: { id: number; label: string }
      usage: number[]
    }>[]
  > = {
    0: [
      ...defaultColumns,
      {
        header: 'Imports',
        accessorKey: 'import',
      },
      {
        header: 'Exports',
        accessorKey: 'export',
      },
      {
        header: 'Production',
        accessorKey: 'production',
      },
      {
        header: 'Import Quotas',
        accessorKey: 'import_quotas',
      },
      {
        header: 'Date ban',
        accessorKey: 'date_ban',
      },
      {
        header: 'Remarks',
        accessorKey: 'remarks',
      },
    ],

    1: [
      ...defaultColumns,
      {
        header: 'Imports',
        accessorKey: 'imports',
      },
      {
        header: 'Exports',
        accessorKey: 'exports',
      },
      {
        header: 'Production',
        accessorKey: 'production',
      },
      {
        header: 'Manufacturing of Blends',
        accessorKey: 'manufacturing_of_blends',
      },
      {
        header: 'Import Quotas',
        accessorKey: 'import_quotas',
      },
      {
        header: 'Date ban',
        accessorKey: 'date_ban',
      },
      {
        header: 'Remarks',
        accessorKey: 'remarks',
      },
    ],
  }

  return mappingTableColumns[sectionId] || []
}
