export type ConstantsType = {
  [key in 'I' | 'II' | 'III' | 'IV' | 'V']?: {
    [key in 'adm_d' | 'section_a' | 'section_c']?: {
      label?: string
      title?: string
    }
  }
}

export type ReportVariant = {
  maxYear: number
  minYear: number
  model: keyof ConstantsType
}
