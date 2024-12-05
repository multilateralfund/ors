export const multiYearFilterOptions = [
  { id: true, fullName: 'Multi-Year', name: 'MYA' },
  { id: false, fullName: 'Individual', name: 'IND' },
]

export const tableColumns: { [key: string]: string } = {
  agency: 'Agency',
  amount_polyol: 'Polyol Amount',
  bp_chemical_type_id: 'Chemical type',
  comment_secretariat: 'Comment',
  country_id: 'Country',
  is_multi_year: 'IND/MYA',
  project_cluster_id: 'Cluster',
  project_type_id: 'Type',
  reason_for_exceeding: 'Reason for Exceeding',
  remarks: 'Remarks',
  remarks_additional: 'Remarks (Additional)',
  required_by_model: 'Required by model',
  sector_id: 'Sector',
  status: 'Status',
  subsector_id: 'Subsector',
  substances: 'Substances',
  title: 'Title',
}

export const bpTypes = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Endorsed', value: 'endorsed' },
]
