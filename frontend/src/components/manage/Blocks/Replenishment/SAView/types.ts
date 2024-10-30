import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { ApiReplenishmentSoAVersion } from '@ors/types/api_replenishment_scales_of_assessment'
import { Country } from '@ors/types/store'

import { HTMLAttributes } from 'react'

import Big from 'big.js'

import { FileForUpload } from '@ors/components/manage/Blocks/Replenishment/types'

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
  enableEdit: boolean
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
  enableEdit: boolean
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
  enableEdit: boolean
  extraRows?: Record<string, any>[]
  onAddCancel: AddRowProps['onCancel']
  onAddSubmit: AddRowProps['onSubmit']
  showAdd?: boolean
}

export interface SAViewProps {
  period: string
}
export interface SAViewWrapperProps {
  period?: string
}

export interface SAContribution {
  adj_un_soa?: Big | null
  annual_contributions?: Big | null
  avg_ir: Big | null
  country: string
  country_id: number
  ferm_cur: null | string
  ferm_cur_amount?: Big | null
  ferm_rate: Big | null
  isNew?: boolean
  iso3: string
  opted_for_ferm: boolean | null
  override_adj_un_soa?: Big | null
  override_avg_ir?: Big | null
  override_ferm_cur?: null | string
  override_ferm_rate?: Big | null
  override_opted_for_ferm?: boolean | null
  override_qual_ferm?: boolean | null
  override_un_soa?: Big | null
  qual_ferm: boolean
  un_soa: Big | null
}

export interface SAContributionForSave {
  average_inflation_rate?: null | string
  country_id: number
  currency?: null | string
  exchange_rate?: null | string
  un_scale_of_assessment?: null | string
}

export interface SaveManagerProps {
  comment: string
  currencyDateRange: {
    end: string
    start: string
  }
  data: SAContributionForSave[]
  replenishmentAmount: string
  replenishmentId?: number
  version: ApiReplenishmentSoAVersion | null
  versions: ApiReplenishmentSoAVersion[]
}

export interface SaveData extends Pick<SaveManagerProps, 'comment' | 'data'> {
  amount: string
  currency_date_range_end?: string
  currency_date_range_start?: string
  decision_pdf?: File | FileForUpload | null
  final?: boolean
  replenishment_id: string
}
