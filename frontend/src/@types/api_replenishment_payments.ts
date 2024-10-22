// Response from /api/replenishment/payments

import { ApiReplenishmentFile } from './api_replenishment'
import { ApiReplenishmentInvoice } from './api_replenishment_invoices'
import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentPayment = {
  amount_assessed: null | number
  amount_local_currency: null | number
  amount_received: null | number
  comment: string
  country: Country
  currency: string
  date: string
  exchange_rate: number
  ferm_gain_or_loss: number
  id: number
  invoice: Pick<ApiReplenishmentInvoice, 'id' | 'number'> | null
  payment_files: ApiReplenishmentFile[]
  payment_for_years: string[]
  replenishment: ApiReplenishment | null
  status?: string
}

export type ApiReplenishmentPayments = ApiReplenishmentPayment[]
