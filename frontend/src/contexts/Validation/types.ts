import type { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import type { ApiUsage } from '@ors/types/api_usages'

export interface IUsage {
  quantity: number
}

export interface IRow {
  all_uses?: number | string
  banned_date: null | string
  blend_id: null | number
  chemical_name?: string
  chemical_note?: string
  composition?: string
  current_year_price: number
  destruction?: number | string
  display_name: string
  exports: number | string
  facility?: string
  feedstock?: number | string
  feedstock_gc?: number | string
  group: string
  import_quotas: number
  imports: number | string
  manufacturing_blends?: string
  previous_year_price: number
  production: number | string
  record_usages: IUsage[]
  remarks?: string
  row_id: string
  substance_id: null | number
}

export interface IGlobalValidator {
  highlight: string[]
  id: string
  message: string
  validator: GlobalValidatorFunc
}

export interface IInvalidRowResult {
  highlight_cells?: string[]
  row: string
}

export interface IInvalidGlobalResult {
  highlight?: string[]
}

export type RowValidatorFuncResult = IInvalidRowResult | null | undefined
export type GlobalValidatorFuncResult = IInvalidGlobalResult | null | undefined

export type RowValidatorFuncContext = {
  form: CPBaseForm
  usages: UsageMapping
}

export type GlobalValidatorFuncContext = RowValidatorFuncContext

export type RowValidatorFunc = (
  row: IRow,
  context: RowValidatorFuncContext,
) => RowValidatorFuncResult

export type GlobalValidatorFunc = (
  section_id: ValidationSchemaKeys,
  context: GlobalValidatorFuncContext,
) => GlobalValidatorFuncResult

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
  hasErrors: boolean
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>
  silent: boolean
}

export interface IValidationProvider {
  children: React.ReactNode
  form: CPBaseForm
  model?: string
  silent?: boolean
}
