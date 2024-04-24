export interface IUsage {
  quantity: number
}

export interface IRow {
  exports: number
  imports: number
  production: number
  record_usages: IUsage[]
  remarks?: string
  row_id: string
}

export interface IGlobalValidator {}

export interface IRowValidator {
  highlight_cells: Record<string, (row: IRow) => boolean>
  id: string
  message: string
  validator: (row: IRow) => boolean
}

export interface IValidator {
  global?: IGlobalValidator[]
  rows?: IRowValidator[]
}

export interface IRowValidationResult {
  highlight_cells: string[]
  id: string
  message: string
  row_id: string
}
export interface IGlobalValidationResult {
  highlight?: string[]
  id: string
  message: string
}

export type ValidationSchemaKeys =
  | 'report_info'
  | 'section_a'
  | 'section_b'
  | 'section_c'
  | 'section_d'
  | 'section_e'
  | 'section_f'

export type ValidationSchema = {
  [key in ValidationSchemaKeys]?: IValidator
}

export type ValidateSectionResult = {
  global: IGlobalValidationResult[]
  hasErrors: boolean
  rows: Record<string, Omit<IRowValidationResult, 'row_id'>[]>
}
