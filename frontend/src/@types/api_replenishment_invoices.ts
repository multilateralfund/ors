// Response from /api/replenishment/invoices

import { ApiReplenishmentFile } from './api_replenishment'
import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentInvoice = {
  amount_local_currency: null | number
  amount_usd: null | number
  country: Country
  currency: string
  date_first_reminder: null
  date_of_issuance: string
  date_paid: null
  date_second_reminder: null
  date_sent_out: string
  exchange_rate: null | number
  id: number
  invoice_files: ApiReplenishmentFile[]
  is_ferm: boolean
  number: string
  status: string
  year: number
}

export type ApiReplenishmentInvoices = ApiReplenishmentInvoice[]
