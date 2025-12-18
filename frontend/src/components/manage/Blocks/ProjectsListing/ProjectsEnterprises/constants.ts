import dayjs from 'dayjs'

export const textFields = ['name', 'location', 'stage', 'application']
export const remarksFields = ['agency_remarks', 'secretariat_remarks']
export const dateFields = ['date_of_revision']
export const detailsDateFields = [
  'planned_completion_date',
  'actual_completion_date',
  'date_of_approval',
  'date_of_report',
]
export const integerFields = ['revision']
export const decimalFields = ['local_ownership', 'export_to_non_a5']
export const substanceDecimalFields = ['chemical_phased_out', 'impact']
export const substanceFields = [
  'consumption',
  'selected_alternative',
  'chemical_phased_in',
]

export const enterpriseFieldsMapping: { [key: string]: string } = {
  id: 'Enterprise',
  code: 'Code',
  name: 'Enterprise',
  country: 'Country',
  location: 'Location',
  stage: 'Stage',
  sector: 'Sector',
  subsector: 'Sub-sector',
  application: 'Application',
  local_ownership: 'Local ownership (%)',
  export_to_non_a5: 'Export to non-A5 (%)',
  revision: 'Revision number',
  date_of_revision: 'Date of revision',
  consumption: 'Consumption (mt)',
  selected_alternative: 'Selected alternative',
  chemical_phased_in: 'Chemical phased in (mt)',
  ods_substance: 'Chemical name',
  ods_blend: 'Chemical name',
  chemical_phased_out: 'Chemical phased out (mt)',
  impact: 'Impact (total ODP tonnes)',
  capital_cost_approved: 'Capital cost approved (US $)',
  operating_cost_approved: 'Operating cost approved (US $)',
  funds_disbursed: 'Funds disbursed (US $)',
  funds_approved: 'Funds approved (US $) (computed)',
  cost_effectiveness_approved:
    'Cost effectiveness approved (US $/kg) (computed)',
  capital_cost_disbursed: 'Capital cost disbursed (US $)',
  operating_cost_disbursed: 'Operating cost disbursed (US $)',
  cost_effectiveness_actual: 'Cost effectiveness actual (US $/kg)',
  co_financing_planned: 'Co-financing planned (US $)',
  co_financing_actual: 'Co-financing actual (US $)',
  funds_transferred: 'Funds transferred (US $)',
  agency: 'Agency',
  project_type: 'Type',
  planned_completion_date: 'Planned completion date',
  actual_completion_date: 'Actual completion date',
  project_duration: 'Project duration',
  date_of_approval: 'Date of approval',
  meeting: 'Meeting',
  excom_provision: 'ExCom provision',
  date_of_report: 'Date of report',
  agency_remarks: 'Agency remarks',
  secretariat_remarks: 'Secretariat remarks',
}

export const initialOverviewFields = {
  name: '',
  country: null,
  location: '',
  stage: '',
  sector: null,
  subsector: null,
  application: '',
  local_ownership: null,
  export_to_non_a5: null,
  revision: null,
  date_of_revision: dayjs().format('YYYY-MM-DD'),
}

export const initialDetailsFields = {
  agency: null,
  project_type: null,
  planned_completion_date: null,
  actual_completion_date: null,
  project_duration: null,
  meeting: null,
  date_of_approval: null,
  date_of_report: dayjs().format('YYYY-MM-DD'),
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
  chemical_phased_in: null,
}

export const initialFundingDetailsFields = {
  capital_cost_approved: null,
  operating_cost_approved: null,
  funds_disbursed: null,
  funds_approved: null,
  cost_effectiveness_approved: null,
  funds_transferred: null,
  cost_effectiveness_actual: null,
  capital_cost_disbursed: null,
  operating_cost_disbursed: null,
  co_financing_planned: null,
  co_financing_actual: null,
}

export const initialRemarksFields = {
  agency_remarks: '',
  secretariat_remarks: '',
}
