// Response from /api/replenishment/payments

import { ApiReplenishmentFile } from './api_replenishment'
import { ApiReplenishmentInvoice } from './api_replenishment_invoices'
import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentPayment = {
  amount: number
  comment: string
  country: Country
  currency: string
  date: string
  exchange_rate: number
  ferm_gain_or_loss: number
  id: number
  invoices: Pick<ApiReplenishmentInvoice, 'id' | 'number'>[]
  payment_files: ApiReplenishmentFile[]
  payment_for_years: string[]
  replenishment: ApiReplenishment | null
}

export type ApiReplenishmentPayments = ApiReplenishmentPayment[]
