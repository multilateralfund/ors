import type { ApiReplenishmentFile } from '@ors/types/api_replenishment'
import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import { FormDialogProps } from '../types'

export type ParsedInvoice = {
  amount: number | string
  be_amount: number
  be_exchange_rate: number
  can_delete: boolean
  can_edit: boolean
  country: string
  country_id: number
  currency: string
  date_first_reminder: null | string
  date_of_issuance: null | string
  date_second_reminder: null | string
  date_sent_out: null | string
  exchange_rate: null | number | string
  files: JSX.Element
  files_data: ApiReplenishmentFile[]
  gray: boolean
  id: number
  is_arrears: boolean
  is_ferm: boolean
  iso3: string
  number: string
  replenishment: ApiReplenishment
  status: JSX.Element
  year: number | string
}

export type InvoiceForSubmit = {
  currency: string
  date_first_reminder: null | string
  date_of_issuance: null | string
  date_second_reminder: null | string
  date_sent_out: null | string
  exchange_rate: number | string
  is_arrears: boolean
  is_ferm: string
  reminder: null | string
  replenishment_id?: number
  status: null | string
  year: null | string
} & { [key: string]: File }

export type InvoiceColumn = {
  field: string
  label: JSX.Element | string
  sortable?: boolean
  subLabel?: string
}

export interface InvoiceDialogProps extends FormDialogProps {
  countries: Country[]
  data?: any
  isEdit?: boolean
}
