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
  sort_order: number
  substance_id: null | number
}

export type EmptyFormType = {
  substance_rows: {
    [key in 'section_a' | 'section_b' | 'section_c']: EmptyFormSubstance[]
  }
  usage_columns: {
    [key in 'section_a' | 'section_b']: EmptyFormUsageColumn[]
  }
}
