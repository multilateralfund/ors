import { CPHistoryItem, CommentData } from '@ors/types/store'

type cp_report = {
  comment: null | string
  country: string
  country_id: number
  created_at?: string
  final_version_id?: number
  id: number
  name: string
  status: string
  version: number
  year: number
}
type ApiBase = {
  [key in 'section_a' | 'section_b']: {
    banned_date: null | string
    blend_id: null | number
    chemical_name: string
    chemical_note: null | string
    chemical_sort_order: number
    display_name: string
    excluded_usages: number[]
    export_quotas: null | string
    export_quotas_gwp: number
    export_quotas_odp: number
    exports: null | string
    exports_gwp: number
    exports_odp: number
    group: 'Annex A, Group I'
    id: 0
    import_quotas: null | string
    import_quotas_gwp: number
    import_quotas_odp: number
    imports: null | string
    imports_gwp: number
    imports_odp: number
    manufacturing_blends: null | string
    production: null | string
    production_gwp: number
    production_odp: number
    record_usages: {
      quantity: string
      quantity_gwp: string
      quantity_odp: string
      usage: string
      usage_id: number
    }[]
    remarks: null | string
    row_id: string
    substance_id: number
  }[]
} & {
  [key in 'adm_b' | 'adm_c' | 'adm_d']?: {
    row_id: number
    row_text: string
    values: {
      column_id: number
      id: number
      row_id: number
      value_choice_id: null | number
      value_text: string
    }[]
  }[]
} & {
  comments: CommentData[]
  history: CPHistoryItem[]
  report_info?: {
    reported_section_a: boolean
    reported_section_b: boolean
    reported_section_c: boolean
    reported_section_d: boolean
    reported_section_e: boolean
    reported_section_f: boolean
    reporting_email: null | string
    reporting_entry: null | string
  }
  section_c: {
    blend_id: null | number
    chemical_name: string
    chemical_note: null | string
    chemical_sort_order: number
    computed_prev_year_price: string
    current_year_price: string
    display_name: string
    group: string
    id: number
    previous_year_price: string
    remarks: null | string
    row_id: string
    substance_id: number
  }[]
  section_d: {
    all_uses: null | string
    chemical_name: string
    destruction: string
    display_name: string
    feedstock: string
    id: number
    row_id: string
  }[]
  section_e: {
    all_uses: null | string
    destruction: string
    destruction_wpc: string
    facility: string
    feedstock_gc: string
    feedstock_wpc: string
    generated_emissions: string
    id: number
    remarks: null | string
    row_id: string
    total: string
  }
  section_f: {
    remarks: null | string
  }
}

// The server response contains the cp_report property which is destructured into the root by the client.
export type ApiCPReport = ApiBase & { cp_report: cp_report }
export type CPReport = ApiBase & cp_report
