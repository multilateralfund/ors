export enum CPModel {
  /** Fallback: Unknown model */
  UNKNOWN = 'UNKNOWN',
  /** 1995 -> 2004 */
  I = 'I',
  /** 2005 -> 2011 */
  II = 'II',
  /** 2012 -> 2018 */
  III = 'III',
  /** 2019 -> 2022 */
  IV = 'IV',
  /** 2023 -> 2024 */
  V = 'V',
  /** 2025+ */
  VI = 'VI',
}

export type ConstantsType = {
  [key in CPModel]?: {
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
  match: (models: CPModel[]) => boolean
}
