export type EmptyFormUsageColumn = {
  children?: EmptyFormUsageColumn[]
  columnCategory: string
  dataType: string
  full_name: string
  headerName: string
  id: number
  sort_order: number
}

export type EmptyFormSubstance = {
  blend_id: null | number
  chemical_name: string
  chemical_note: null | string
  excluded_usages: number[]
  group: string
  gwp: number
  odp: number
  sort_order: number
  substance_id: null | number
}

export type EmptyFormType = {
  adm_b?: AdmSection
  adm_c?: AdmSection
  adm_d?: AdmSection
  previous_substances: {
    [key in 'section_a' | 'section_b' | 'section_c']: EmptyFormSubstance[]
  }
  substance_rows: {
    [key in 'section_a' | 'section_b' | 'section_c']: EmptyFormSubstance[]
  }
  usage_columns: {
    [key in 'section_a' | 'section_b']: EmptyFormUsageColumn[]
  }
}

export type AdmColumn = {
  category: string
  children: AdmColumn[]
  display_name: string
  full_name: string
  id: number
  sort_order: number
  type: string
}

export type AdmRowChoice = {
  id: any
  sort_order: any
  text_label: any
  value: any
  with_text: any
}

export type AdmRow = {
  choices: AdmRowChoice[]
  excluded_columns: number[]
  id: number
  index: string
  level: number
  parent_id: null | number
  sort_order: number
  text: string
  type: string
}

export type AdmSection = {
  columns: AdmColumn[]
  rows: AdmRow[]
}
