export const multiYearFilterOptions = [
  { id: false, fullName: 'Individual', name: 'I' },
  { id: true, fullName: 'Multi-Year', name: 'M' },
]

export const tableColumns: { [key: string]: string } = {
  agency_id: 'Agency',
  amount_polyol: 'Amount of polyol in project (MT)',
  bp_chemical_type_id: 'Chemical',
  country_id: 'Country',
  is_multi_year: 'I-Indiv M-MY',
  lvc_status: 'HCFC status',
  project_cluster_id: 'Cluster',
  project_type_id: 'Type',
  remarks: 'Remarks',
  required_by_model: 'Required by model',
  sector_id: 'Sector',
  status: "A-Appr. P-Plan'd",
  subsector_id: 'Subsector',
  substances: 'Chemical detail',
  title: 'Title',
  values: 'Values',
}

export const bpTypes = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Endorsed', value: 'endorsed' },
]

export const lvcStatuses = [
  { id: 'LVC', name: 'LVC' },
  { id: 'Non-LVC', name: 'Non-LVC' },
  { id: 'Regional', name: 'Regional' },
  { id: 'Global', name: 'Global' },
  { id: 'NDR', name: 'NDR' },
  { id: 'Undefined', name: 'Undefined' },
]
