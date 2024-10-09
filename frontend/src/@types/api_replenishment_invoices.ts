// Response from /api/replenishment/invoices

import { ApiReplenishmentFile } from './api_replenishment'
import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentInvoice = {
  amount: number
  country: Country
  currency: string
  date_first_reminder: null
  date_of_issuance: string
  date_paid: null
  date_second_reminder: null
  date_sent_out: string
  exchange_rate: number
  id: number
  invoice_files: ApiReplenishmentFile[]
  number: string
  replenishment: ApiReplenishment
  status: string
  year: number
}

export type ApiReplenishmentInvoices = ApiReplenishmentInvoice[]
