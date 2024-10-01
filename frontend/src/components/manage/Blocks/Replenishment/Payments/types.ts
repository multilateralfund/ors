import { ApiReplenishmentFile } from '@ors/types/api_replenishment'
import { ApiReplenishmentInvoice } from '@ors/types/api_replenishment_invoices'
import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import { FormDialogProps } from '../types'

export type PaymentColumn<LabelType = string> = {
  field: string
  label: LabelType
  sortable?: boolean
  subLabel?: string
}

export interface IPaymentDialogProps extends FormDialogProps {
  columns: Record<string, PaymentColumn>
  countries: Country[]
  data?: ParsedPayment
  isEdit?: boolean
}

export type PaymentForSubmit = {
  date: null | string
  exchange_rate: number | string
  ferm_gain_or_loss: number | string
  invoices: string[]
  reminder: string
  year: string
} & { [key: string]: File }

export type ParsedPayment = {
  amount: null | number | string
  amount_local_currency?: null | number | string
  be_amount: number
  be_exchange_rate: number
  be_ferm: number
  comment: string
  country: string
  country_id: number
  currency: string
  date: null | string
  exchange_rate: null | number | string
  ferm_gain_or_loss: number | string
  files: JSX.Element
  files_data: ApiReplenishmentFile[]
  id: number
  invoices: Pick<ApiReplenishmentInvoice, 'id' | 'number'>[]
  iso3: string
  payment_for_year: string
  replenishment: ApiReplenishment | null
}

export type FormattedPayment = {
  ferm_gain_or_loss: JSX.Element | number | string
} & Omit<ParsedPayment, 'ferm_gain_or_loss'>
