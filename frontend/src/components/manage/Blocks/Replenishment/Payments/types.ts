import { ApiReplenishmentFile } from '@ors/types/api_replenishment'
import { ApiReplenishmentInvoice } from '@ors/types/api_replenishment_invoices'
import { ApiReplenishmentPayment } from '@ors/types/api_replenishment_payments'
import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import React from 'react'

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
  data?: PaymentDataFields
  is_ferm?: boolean
  isEdit?: boolean
}

export type PaymentForSubmit = {
  date: null | string
  exchange_rate: number | string
  ferm_gain_or_loss: number | string
  invoices?: string[]
  is_ferm?: string
  payment_for_years?: string[]
} & { [key: string]: File }

export type ParsedPayment = {
  amount_assessed: null | number | string
  amount_local_currency?: null | number | string
  amount_received: null | number | string
  be_amount_assessed: ApiReplenishmentPayment['amount_assessed']
  be_amount_local_currency: ApiReplenishmentPayment['amount_local_currency']
  be_amount_received: ApiReplenishmentPayment['amount_received']
  be_exchange_rate: number
  be_ferm: number
  comment: string
  country: string
  country_id: number
  currency: string
  date: null | string
  exchange_rate: null | number | string
  ferm_gain_or_loss: number | string
  files: React.JSX.Element
  files_data: ApiReplenishmentFile[]
  id: number
  invoice_numbers: string
  invoices: Pick<ApiReplenishmentInvoice, 'id' | 'number'>[]
  iso3: string
  payment_for_years: string[]
  payment_years: string
  replenishment: ApiReplenishment | null
  status?: string
}

export type PaymentDataFields = { is_ferm?: boolean } & ParsedPayment

export type FormattedPayment = {
  ferm_gain_or_loss: React.JSX.Element | number | string
} & Omit<ParsedPayment, 'ferm_gain_or_loss'>
