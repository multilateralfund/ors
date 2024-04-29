import type { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import type { ApiUsage } from '@ors/types/api_usages'

export interface IUsage {
  quantity: number
}

export interface IRow {
  banned_date: null | string
  blend_id: null | number
  chemical_note?: string
  display_name: string
  exports: number
  facility?: string
  group: string
  import_quotas: number
  imports: number
  manufacturing_blends?: string
  production: number
  record_usages: IUsage[]
  remarks?: string
  row_id: string
  substance_id: null | number
}

export interface IGlobalValidator {}

export interface IInvalidRowResult {
  highlight_cells?: string[]
  row: string
}

export type RowValidatorFuncResult = IInvalidRowResult | null | undefined

export type RowValidatorFuncContext = {
  form: CPBaseForm
  usages: UsageMapping
}

export type RowValidatorFunc = (
  row: IRow,
  context: RowValidatorFuncContext,
) => RowValidatorFuncResult

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

export interface IRowValidationResult extends IInvalidRowResult {
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

export type ValidateSectionResultValue = Omit<IRowValidationResult, 'row_id'>

export type ValidateSectionResult = {
  global: IGlobalValidationResult[]
  hasErrors: boolean
  rows: Record<string, ValidateSectionResultValue[]>
}

export type UsageMapping = Record<string, ApiUsage>

export interface IValidationContext {
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>
}

export interface IValidationProvider {
  children: React.ReactNode
  form: CPBaseForm
  model?: string
}
