import { SectionsType } from '@/types/Reports'
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

export const mappingTabsWithSections: Record<
  number | string,
  Partial<SectionsType>
> = {
  0: { label: 'Section A', key: 'A', usages: usagesSectionA },
  1: { label: 'Section B', key: 'B', usages: usagesSectionB },
  2: { label: 'Section C', key: 'C' },
  3: { label: 'Section D', key: 'D' },
  4: { label: 'Section E', key: 'E' },
  5: { label: 'Section F', key: 'F' },
}
