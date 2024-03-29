declare global {
  const __DEVELOPMENT__: boolean
  const __CLIENT__: boolean
  const __SERVER__: boolean
  const __FAST_REFRESH_TRIGGERED__: boolean
}

export type SectionD = Array<{
  all_uses: number
  destruction: number
  display_name: string
  feedstock: number
  id: number
}>

export type SectionE = Array<{
  all_uses: number
  destruction: number
  destruction_wpc: number
  facility: string
  feedstock_gc: number
  feedstock_wpc: number
  generated_emissions: number
  remark: string
  total: number
}>

export type SectionF = {
  remarks: string
}

export type Sections =
  | 'section_a'
  | 'section_b'
  | 'section_c'
  | 'section_d'
  | 'section_e'
  | 'section_f'

export type SectionsData = SectionD | SectionE | SectionF
