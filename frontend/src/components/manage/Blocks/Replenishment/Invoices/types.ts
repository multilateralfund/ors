import type { ApiReplenishmentFile } from '@ors/types/api_replenishment'
import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import { IFormDialogProps } from '../types'

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
  iso3: string
  number: string
  replenishment: ApiReplenishment
  status: JSX.Element
  year: number | string
}

export type InvoiceForSubmit = {
  date_first_reminder: null | string
  date_of_issuance: null | string
  date_second_reminder: null | string
  date_sent_out: null | string
  exchange_rate: number | string
  reminder: null | string
  replenishment_id?: number
  year: string
} & { [key: string]: File }

export type InvoiceColumn = {
  field: string
  label: JSX.Element | string
  sortable?: boolean
  subLabel?: string
}

export interface IInvoiceDialogProps extends IFormDialogProps {
  countries: Country[]
  data?: any
  isEdit?: boolean
}
