export type PCROption = {
  id: number | string
  name: string
}

export type PCRProject = {
  id: number
  pcr_id: number
  project_id: number
  project_metacode: string | null
  country: string | null
  country_id: number
  region: string | null
  region_id: number | null
  lead_agency: string | null
  lead_agency_id: number | null
  cooperating_agencies: string[]
  cooperating_agency_ids: number[]
  cluster: string | null
  cluster_id: number | null
  type: string | null
  type_id: number | null
  sector: string | null
  sector_id: number | null
  subsector: string
  subsector_ids: number[]
  title: string
  category: string | null
  pcr_due: boolean
  pcr_submission_date: string
}

export type PCRFilterOptions = {
  region?: PCROption[]
  country?: PCROption[]
  lead_agency?: PCROption[]
  cooperating_agency?: PCROption[]
  cluster?: PCROption[]
  project_type?: PCROption[]
  sector?: PCROption[]
  subsector?: PCROption[]
  category?: PCROption[]
  pcr_due?: PCROption[]
}
