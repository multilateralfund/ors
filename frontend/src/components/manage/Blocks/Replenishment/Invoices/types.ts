import type { ApiReplenishmentFile } from '@ors/types/api_replenishment'
import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import React from 'react'

import { FormDialogProps } from '../types'

export type ParsedInvoice = {
  amount: null | number | string
  amount_local_currency: null | number | string
  amount_usd: null | number | string
  be_amount_local_currency: number
  be_amount_usd: number
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
  files: React.JSX.Element
  files_data: ApiReplenishmentFile[]
  gray: boolean
  id: number
  is_ferm: boolean
  iso3: string
  number: string
  status: React.JSX.Element
  year: number | string
}

export type InvoiceForSubmit = {
  currency: string
  date_first_reminder: null | string
  date_of_issuance: null | string
  date_second_reminder: null | string
  date_sent_out: null | string
  exchange_rate: number | string
  is_ferm: string
  reminder: null | string
  status: null | string
  year: null | string
} & { [key: string]: File }

export type InvoiceColumn = {
  field: string
  label: React.JSX.Element | string
  sortable?: boolean
  subLabel?: string
}

export interface InvoiceDialogProps extends FormDialogProps {
  countries: Country[]
  data?: any
  isEdit?: boolean
}
