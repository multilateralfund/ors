import { CommentData, HistoryListItem } from '@ors/types/store'

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
    group: string
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
    record_usages: CPReportUsage[]
    remarks: null | string
    row_id: string
    substance_id: number
  }[]
} & {
  comments: CommentData[]
  history: HistoryListItem[]
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
    is_fob: boolean
    is_retail: boolean
    previous_year_price: string
    remarks: null | string
    row_id: string
    substance_id: number
  }[]
  section_d: {
    all_uses: null | string
    chemical_name: string
    destruction: string // deprecated, removed in frontend
    other_uses_quantity: string
    other_uses_remarks: string
    display_name: string
    feedstock: string
    id: number
    row_id: string
  }[]
  section_e: {
    all_uses: null | string
    stored_at_start_of_year: null | string
    destruction: string
    destruction_wpc: string
    facility: string
    feedstock_gc: string
    feedstock_wpc: string
    generated_emissions: string
    stored_at_end_of_year: null | string
    id: number
    remarks: null | string
    row_id: string
    total: string
  }[]
  section_f: {
    remarks: null | string
  }
}

type ApiBaseDiff = {
  [key in 'section_a' | 'section_b']: {
    banned_date: null | string
    blend_id: null | number
    change_type: string
    chemical_name: string
    chemical_note: null | string
    chemical_sort_order: number
    display_name: string
    excluded_usages: number[]
    export_quotas_gwp_old: number
    export_quotas_odp_old: number
    export_quotas_old: null | string
    exports: null | string
    exports_gwp: number
    exports_gwp_old: number
    exports_odp: number
    exports_odp_old: number
    exports_old: null | string
    group: string
    id: 0
    import_quotas: null | string
    import_quotas_gwp: number
    import_quotas_gwp_old: number
    import_quotas_odp: number
    import_quotas_odp_old: number
    import_quotas_old: null | string
    imports: null | string
    imports_gwp: number
    imports_gwp_old: number
    imports_odp: number
    imports_odp_old: number
    imports_old: null | string
    manufacturing_blends: null | string
    production_gwp_old: number
    production_odp_old: number
    production_old: null | string
    record_usages: {
      quantity_gwp_old: string
      quantity_odp_old: string
      quantity_old: string
      usage: string
      usage_id: number
    }[]
    remarks: null | string
    remarks_old: null | string
    row_id: string
    substance_id: number
  }[]
} & {
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
    change_type: string
    chemical_name: string
    chemical_note: null | string
    chemical_sort_order: number
    computed_prev_year_price: string
    current_year_price: string
    display_name: string
    group: string
    id: number
    is_fob: boolean
    is_retail: boolean
    previous_year_price: string
    remarks: null | string
    remarks_old: null | string
    row_id: string
    substance_id: number
  }[]
  section_d: {
    all_uses: null | string
    change_type: string
    chemical_name: string
    destruction: string // deprecated, removed in frontend
    other_uses_quantity: string
    other_uses_remarks: string
    display_name: string
    id: number
    row_id: string
  }[]
  section_e: {
    all_uses: null | string
    stored_at_start_of_year: null | string
    change_type: string
    destruction: string
    destruction_wpc: string
    facility: string
    feedstock_gc: string
    feedstock_wpc: string
    generated_emissions: string
    stored_at_end_of_year: null | string
    id: number
    remarks: null | string
    remarks_old: null | string
    row_id: string
    total: string
  }[]
  section_f: {
    remarks: null | string
    remarks_old: null | string
  }[]
}

// The server response contains the cp_report property which is destructured into the root by the client.
export type ApiCPReport = { cp_report: cp_report } & ApiBase
export type CPReport = ApiBase & cp_report
export type CPReportDiff = ApiBaseDiff
export type CPReportUsage = {
  quantity: string
  quantity_gwp: number
  quantity_odp: number
  usage: string
  usage_id: number
}
