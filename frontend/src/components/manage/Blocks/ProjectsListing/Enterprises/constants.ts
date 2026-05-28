export const textFields = ['name', 'city', 'location', 'application', 'stage']
export const decimalFields = ['local_ownership', 'export_to_non_a5']
export const integerFields = ['project_duration', 'revision_number']
export const dateFields = [
  'planned_completion_date',
  'actual_completion_date',
  'date_of_revision',
  'date_of_approval',
  'date_of_report',
]
export const substanceDetailsFields = ['chemical_phased_out', 'impact']
export const substanceFields = [
  'consumption',
  'selected_alternative',
  'chemical_phased_in_mt',
]
export const textAreaFields = [
  'excom_provision',
  'agency_remarks',
  'secretariat_remarks',
]

export const enterpriseFieldsMapping: { [key: string]: string } = {
  id: 'Enterprise',
  code: 'Code',
  name: 'Enterprise',
  country: 'Country',
  agency: 'Agency',
  city: 'City',
  location: 'Location',
  project_type: 'Type',
  sector: 'Sector',
  subsector: 'Sub-sector',
  status: 'Status',
  local_ownership: 'Local ownership (%)',
  export_to_non_a5: 'Export to non-A5 (%)',
  application: 'Application',
  planned_completion_date: 'Planned completion date',
  actual_completion_date: 'Actual completion date',
  project_duration: 'Project duration',
  stage: 'Stage',
  revision_number: 'Revision number',
  date_of_revision: 'Date of revision',
  meeting: 'Meeting',
  date_of_approval: 'Date of approval',
  date_of_report: 'Date of report',
  excom_provision: 'Executive Committee provision',
  chemical_phased_out: 'Chemical phased out (mt)',
  impact: 'Impact (total ODP tonnes)',
  ods_substance: 'Chemical name',
  ods_blend: 'Chemical name',
  consumption: 'Consumption (mt)',
  selected_alternative: 'Selected alternative',
  chemical_phased_in_mt: 'Chemical phased in (mt)',
  capital_cost_approved: 'Capital cost approved (US $)',
  operating_cost_approved: 'Operating cost approved (US $)',
  funds_approved: 'Funds approved (US $) (computed)',
  cost_effectiveness_approved:
    'Cost effectiveness approved (US $/kg) (computed)',
  cost_effectiveness_actual: 'Cost effectiveness actual (US $/kg)',
  funds_disbursed: 'Funds disbursed (US $)',
  funds_transferred: 'Funds transferred (US $)',
  capital_cost_disbursed: 'Capital cost disbursed (US $)',
  operating_cost_disbursed: 'Operating cost disbursed (US $)',
  co_financing_planned: 'Co-financing planned (US $)',
  co_financing_actual: 'Co-financing actual (US $)',
  agency_remarks: 'Agency remarks',
  secretariat_remarks: 'Secretariat remarks',
}

export const initialOverviewFields = {
  name: '',
  country: null,
  agency: null,
  city: '',
  location: '',
  project_type: null,
  sector: null,
  subsector: null,
  status: null,
}

export const initialDetailsFields = {
  local_ownership: null,
  export_to_non_a5: null,
  application: '',
  planned_completion_date: null,
  actual_completion_date: null,
  project_duration: null,
  stage: '',
  revision_number: null,
  date_of_revision: null,
  meeting: null,
  date_of_approval: null,
  date_of_report: null,
  excom_provision: '',
}

export const initialSubstanceFields = {
  chemical_phased_out: null,
  impact: null,
}

export const initialSubstanceDetailsFields = {
  ods_substance: null,
  ods_blend: null,
  consumption: null,
  selected_alternative: '',
  chemical_phased_in_mt: null,
}

export const initialFundingDetailsFields = {
  capital_cost_approved: null,
  operating_cost_approved: null,
  funds_approved: null,
  cost_effectiveness_approved: null,
  cost_effectiveness_actual: null,
  funds_disbursed: null,
  funds_transferred: null,
  capital_cost_disbursed: null,
  operating_cost_disbursed: null,
  co_financing_planned: null,
  co_financing_actual: null,
}

export const initialRemarksFields = {
  agency_remarks: '',
  secretariat_remarks: '',
}
