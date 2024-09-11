import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { ApiReplenishmentSoAVersion } from '@ors/types/api_replenishment_scales_of_assessment'
import { Country } from '@ors/types/store'

import { HTMLAttributes } from 'react'

import { IDateInputProps } from '../Inputs'
import { TableCellProps, TableColumn, TableProps } from '../Table/types'

export interface SAHeadingProps {}

export interface SATableColumn extends TableColumn {
  confirmationText?: string
  editOptions?: { label: 'No' | 'Yes'; value: 'false' | 'true' }[]
  editParser?: (value: any) => string
  editWidget?: 'select' | string
  editable?: boolean
  field: keyof SAContribution
  parser?: (value: any) => any
  subLabel?: string
  validator?: (value: any) => string | void
}

export interface SATableCellProps
  extends Omit<
    TableCellProps,
    'adminButtons' | 'columns' | 'onDelete' | 'onEdit' | 'rowData'
  > {
  columns: SATableColumn[]
  onCellEdit?: (
    rowIndex: number,
    colIndex: number,
    fname: keyof SAContribution,
    value: any,
  ) => void
  onCellRevert?: (rowIndex: number, fname: keyof SAContribution) => void
  onDelete?: (rowIndex: number) => void
  rowData: Record<string, any>[] | SATableRow[]
}

export interface SATableAdminButtonsProps {
  onDelete: () => void
}

export interface AddRowProps {
  columns: SATableColumn[]
  countries: Country[]
  onCancel: () => void
  onSubmit: (country: Country) => void
}

export interface ViewFieldProps {
  cell: any
  onRevert: () => void
}

export interface EditFieldProps extends HTMLAttributes<HTMLElement> {
  column: SATableColumn
  value: any
}

export type SATableRow = {
  [key in keyof SAContribution]: {
    edit: any
    hasOverride: boolean
    isEditable: boolean
    view: any
  }
}

export interface SATableProps
  extends Pick<
      SATableCellProps,
      'columns' | 'onCellEdit' | 'onCellRevert' | 'onDelete' | 'rowData'
    >,
    Omit<TableProps, 'columns' | 'extraRows' | 'onDelete' | 'rowData'> {
  countriesForAdd: Country[]
  enableEdit?: boolean
  extraRows?: Record<string, any>[]
  onAddCancel: AddRowProps['onCancel']
  onAddSubmit: AddRowProps['onSubmit']
  showAdd?: boolean
}

export interface SAViewProps {
  period: string
}

export interface FileForUpload {
  contentType: string
  data: string
  encoding: string
  filename: string
}

export interface DateRangeInputProps
  extends Omit<IDateInputProps, 'onChange' | 'value'> {
  initialEnd: string
  initialStart: string
  onChange: (start: string, end: string) => void
}

export interface SAContribution {
  adj_un_soa?: number
  annual_contributions?: number
  avg_ir: null | number
  country: string
  country_id: number
  ferm_cur: null | string
  ferm_cur_amount?: number
  ferm_rate: null | number
  isNew?: boolean
  iso3: string
  opted_for_ferm: boolean | null
  override_adj_un_soa?: null | number
  override_avg_ir?: null | number
  override_ferm_cur?: null | string
  override_ferm_rate?: null | number
  override_opted_for_ferm?: boolean | null
  override_qual_ferm?: boolean | null
  override_un_soa?: null | number
  qual_ferm: boolean
  un_soa: null | number
}

export interface SAContributionForSave {
  average_inflation_rate?: null | number
  country_id: number
  currency?: null | string
  exchange_rate?: null | number
  un_scale_of_assessment?: null | number
}

export interface SaveManagerProps {
  comment: string
  currencyDateRange: {
    end: Date
    start: Date
  }
  data: SAContributionForSave[]
  replenishment: ApiReplenishment
  version: ApiReplenishmentSoAVersion | null
  versions: ApiReplenishmentSoAVersion[]
}

export interface SaveData extends Pick<SaveManagerProps, 'comment' | 'data'> {
  amount: number
  currency_date_range_end?: string
  currency_date_range_start?: string
  decision_pdf?: File | FileForUpload | null
  final?: boolean
  replenishment_id: number
}
