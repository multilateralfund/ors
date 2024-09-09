// Response from /api/replenishment/invoices

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
  year: number
}

export type ApiReplenishmentFile = {
  download_url: string
  file_type: string
  filename: string
  id: number
}

export type ApiReplenishmentInvoices = ApiReplenishmentInvoice[]
