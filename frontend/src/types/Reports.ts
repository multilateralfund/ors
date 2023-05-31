export type GroupSubstance = {
  id: number
  name: string
  name_alt: string
  substances: Substance[] | null
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

export type Usage = {
  id: number
  name: string
  full_name: string
  sort_order: number
  children: {
    id: number
    name: string
    parent: number
  }[]
}

export type SectionsType = {
  label: string
  key?: string
  usages?: string[]
  substances?: string[]
}

export type TableColumnType = {
  header: string
  accessorKey?: string
  cell?: () => void
  columns?: TableColumnType[]
}
