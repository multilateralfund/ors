import { Cell } from '@tanstack/react-table'

export type GroupSubstance = {
  id: number
  name: string
  name_alt: string
  substances: Substance[] | null
}

export type Chemical = {
  id: number
  label: string
  excluded_usages: number[]
  blend?: boolean
}

export type Substance = {
  id: number
  name: string
  description: string
  formula: string
  sort_order: number
  is_captured: boolean
  is_contained_in_polyols: boolean
  odp: string
  excluded_usages: number[]
}
export type Blend = {
  id: number
  name: string
  other_names: string
  sort_order: number
  excluded_usages: number[]
  blend?: boolean
}

export type Usage = {
  id: number
  name: string
  full_name: string
  sort_order: number
  children: Usage[]
}

export type Country = {
  id: number
  name: string
}

export type CountryReports = {
  id: number
  name: string
  year: number
  country: string
  comment?: string
  status?: string
}

export interface CountryReportsFilters {
  country_id?: number
  name?: string
  year?: number
}

export enum SectionsEnum {
  SectionA = 'A',
  SectionB = 'B',
  SectionC = 'C',
  SectionD = 'D',
}

export type SectionsType = {
  label: string
  key?: string
  usages?: string[]
  substances?: string[]
}

export type TableColumnType<DataT> = {
  header: string
  accessorKey?: string
  cell?: (cell?: Cell<DataT, unknown>) => void
  columns?: TableColumnType<DataT>[]
}
