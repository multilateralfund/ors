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

export const mappingTableColumns: Record<
  number | string,
  { columns: TableColumnType[] }
> = {
  0: {
    columns: [
      {
        header: 'Substance',
        accessorKey: '0',
      },
      {
        header: 'Aerosol',
        accessorKey: '1',
      },
      {
        header: 'Foam',
        accessorKey: '2',
      },
      {
        header: 'Fire Fighting',
        accessorKey: '3',
      },
      {
        header: 'Refrigeration',
        columns: [
          {
            header: 'Manufacturing',
            accessorKey: '4',
          },
          {
            header: 'Servicing',
            accessorKey: '5',
          },
        ],
      },
      {
        header: 'Solvent',
        accessorKey: '6',
      },
      {
        header: 'Process agent',
        accessorKey: '7',
      },
      {
        header: 'Lab use',
        accessorKey: '8',
      },
      {
        header: 'Methyl Bromide',
        columns: [
          {
            header: 'QPS',
            accessorKey: '9',
          },
          {
            header: 'Non-QPS',
            accessorKey: '10',
          },
        ],
      },
      {
        header: 'TOTAL',
        accessorKey: '11',
      },
    ],
  },
  1: {
    columns: [
      {
        header: 'Substance',
        accessorKey: '0',
      },
      {
        header: 'Aerosol',
        accessorKey: '1',
      },
      {
        header: 'Foam',
        accessorKey: '2',
      },
      {
        header: 'Fire Fighting',
        accessorKey: '3',
      },
      {
        header: 'Refrigeration',
        columns: [
          {
            header: 'Manufacturing',
            columns: [
              {
                header: 'Other',
                accessorKey: '12',
              },
              {
                header: 'AC',
                accessorKey: '123',
              },
              {
                header: 'Total',
                accessorKey: '1234',
              },
            ],
          },
          {
            header: 'Servicing',
            accessorKey: '5',
          },
        ],
      },
      {
        header: 'Solvent',
        accessorKey: '6',
      },
      {
        header: 'Other',
        accessorKey: '7',
      },
      {
        header: 'TOTAL',
        accessorKey: '11',
      },
    ],
  },
}
