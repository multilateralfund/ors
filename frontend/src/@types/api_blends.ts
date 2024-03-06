export type ApiBlend = {
  chemical_note: null | string
  components: {
    component_name: string
    percentage: number
    substance_id: number
  }[]
  composition: string
  composition_alt: string
  excluded_usages: number[]
  group: string
  gwp: string
  id: number
  is_contained_in_polyols: boolean
  name: string
  odp: string
  other_names: string
  sections: string[]
  sort_order: number
  type: string
}
