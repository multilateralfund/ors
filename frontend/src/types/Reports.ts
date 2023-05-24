export type GroupSubstance = {
  id: number
  name: string
  annex: string
  name_alt: string
  description: string
  substances: Substance[] | null
}

export type Substance = {
  id: number
  name: string
  description: string
  formula: string
  sort_order: number
  group: GroupSubstance | null
}

export type Usage = {
  id: number
  name: string
  full_name: string
  description: string | null | undefined
  parent: {
    id: number
    name: string
    parent: number
  }
}
