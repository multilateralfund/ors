import { ApiUsage } from '@ors/types/api_usages'

export interface IUsage {
  quantity: number
}

export interface IRow {
  banned_date: null | string
  blend_id: null | number
  exports: number
  group: string
  imports: number
  production: number
  record_usages: IUsage[]
  remarks?: string
  row_id: string
  substance_id: null | number
}

export interface IGlobalValidator {}

export type RowValidatorFunc = (row: IRow, usages: UsageMapping) => boolean

export interface IRowValidator {
  highlight_cells: Record<string, (row: IRow) => boolean>
  id: string
  message: string
  validator: RowValidatorFunc
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

export type UsageMapping = Record<string, ApiUsage>
