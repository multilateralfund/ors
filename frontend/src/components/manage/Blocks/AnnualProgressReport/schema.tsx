import { AgGridReactProps } from 'ag-grid-react'

interface APRTableColumn {
  label: string
  fieldName: string
  group: string | null
  input: boolean
  overrideOptions?: NonNullable<AgGridReactProps['columnDefs']>[number]
}

export const tableColumns: Record<string, APRTableColumn> = {
  metaCode: {
    label: 'Meta Code',
    fieldName: 'meta_code',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 100,
    },
  },
  projectCode: {
    label: 'Project Code',
    fieldName: 'project_code',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 100,
    },
  },
  legacyCode: {
    label: 'Legacy Code',
    fieldName: 'legacy_code',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 120,
    },
  },
  agency: {
    label: 'Agency',
    fieldName: 'agency_name',
    group: null,
    input: false,
  },
  cluster: {
    label: 'Cluster',
    fieldName: 'cluster_name',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 150,
    },
  },
  region: {
    label: 'Region',
    fieldName: 'region_name',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 150,
    },
  },
  country: {
    label: 'Country',
    fieldName: 'country_name',
    group: null,
    input: false,
  },
  type: { label: 'Type', fieldName: 'type_code', group: null, input: false },
  sector: {
    label: 'Sector',
    fieldName: 'sector_code',
    group: null,
    input: false,
  },
  projectTitle: {
    label: 'Project Title',
    fieldName: 'project_title',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 300,
    },
  },
  // Date data fields
  dateApproved: {
    label: 'Date Approved',
    fieldName: 'date_approved',
    group: 'Date data fields',
    input: false,
  },
  dateCompletionProposal: {
    label: 'Date of Completion per Proposal',
    fieldName: 'date_completion_proposal',
    group: 'Date data fields',
    input: false,
    overrideOptions: {
      minWidth: 120,
    },
  },
  status: {
    label: 'Status',
    // TODO: fieldname
    fieldName: '',
    group: 'Date data fields',
    input: true,
  },
  firstDisbursementDate: {
    label: 'First Disbursement Date',
    fieldName: 'date_first_disbursement',
    group: 'Date data fields',
    input: true,
    overrideOptions: {
      minWidth: 140,
    },
  },
  plannedDateOfCompletion: {
    label: 'Planned Date of Completion',
    fieldName: 'date_planned_completion',
    group: 'Date data fields',
    input: true,
    overrideOptions: {
      minWidth: 160,
    },
  },
  dateCompletedActual: {
    label: 'Date Completed (Actual)',
    fieldName: 'date_actual_completion',
    group: 'Date data fields',
    input: true,
    overrideOptions: {
      minWidth: 140,
    },
  },
  dateFinancialCompletion: {
    label: 'Date of Financial Completion',
    fieldName: 'date_financial_completion',
    group: 'Date data fields',
    input: true,
    overrideOptions: {
      minWidth: 160,
    },
  },
  // Phaseout data fields
  consumptionODPMTProposal: {
    label: 'Consumption ODP/MT to be Phased Out per Proposal',
    fieldName: 'consumption_phased_out_odp_proposal',
    group: 'Phaseout data fields',
    input: false,
    overrideOptions: {
      minWidth: 160,
    },
  },
  consumptionODPCO2Proposal: {
    label: 'Consumption to be Phased Out per Proposal in CO2-eq Tonnes',
    fieldName: 'consumption_phased_out_co2_proposal',
    group: 'Phaseout data fields',
    input: false,
    overrideOptions: {
      minWidth: 200,
    },
  },
  productionODPMTProposal: {
    label: 'Production ODP/MT to be Phased Out per Proposal',
    fieldName: 'production_phased_out_odp_proposal',
    group: 'Phaseout data fields',
    input: false,
    overrideOptions: {
      minWidth: 160,
    },
  },
  productionODPCO2Proposal: {
    label: 'Production to be Phased Out per Proposal in CO2-eq Tonnes',
    fieldName: 'production_phased_out_co2_proposal',
    group: 'Phaseout data fields',
    input: false,
    overrideOptions: {
      minWidth: 200,
    },
  },
  consumptionODPMTActual: {
    label: 'Consumption ODP/MT Phased Out',
    fieldName: 'consumption_phased_out_odp',
    group: 'Phaseout data fields',
    input: true,
    overrideOptions: {
      minWidth: 160,
    },
  },
  consumptionODPCO2Actual: {
    label: 'Consumption Phased Out in CO2-eq Tonnes',
    fieldName: 'consumption_phased_out_co2',
    group: 'Phaseout data fields',
    input: true,
    overrideOptions: {
      minWidth: 200,
    },
  },
  productionODPMTActual: {
    label: 'Production ODP/MT Phased Out',
    fieldName: 'production_phased_out_odp',
    group: 'Phaseout data fields',
    input: true,
    overrideOptions: {
      minWidth: 160,
    },
  },
  productionODPCO2Actual: {
    label: 'Production Phased Out in CO2-eq Tonnes',
    fieldName: 'production_phased_out_co2',
    group: 'Phaseout data fields',
    input: true,
    overrideOptions: {
      minWidth: 200,
    },
  },
  // Financial data fields
  approvedFunding: {
    label: 'Approved Funding (US$)',
    fieldName: 'approved_funding',
    group: 'Financial data fields',
    input: false,
  },
  adjustment: {
    label: 'Adjustment (US$)',
    fieldName: 'adjustment',
    group: 'Financial data fields',
    input: false,
  },
  approvedFundingPlusAdjustment: {
    label: 'Approved Funding plus Adjustments (US$)',
    fieldName: 'approved_funding_plus_adjustment',
    group: 'Financial data fields',
    input: false,
    overrideOptions: {
      minWidth: 160,
    },
  },
  percentFundsDisbursed: {
    label: 'Per Cent of Funds Disbursed',
    fieldName: 'per_cent_funds_disbursed',
    group: 'Financial data fields',
    input: false,
    overrideOptions: {
      minWidth: 120,
    },
  },
  balance: {
    label: 'Balance (US$)',
    fieldName: 'balance',
    group: 'Financial data fields',
    input: false,
  },
  supportCostApproved: {
    label: 'Support Cost Approved (US$)',
    fieldName: 'support_cost_approved',
    group: 'Financial data fields',
    input: false,
    overrideOptions: {
      minWidth: 120,
    },
  },
  supportCostAdjustment: {
    label: 'Support Cost Adjustment (US$)',
    fieldName: 'support_cost_adjustment',
    group: 'Financial data fields',
    input: false,
    overrideOptions: {
      minWidth: 120,
    },
  },
  supportCostProposedPlusAdjustment: {
    label: 'Support Costs Approved Funding plus Adjustments (US$)',
    fieldName: 'support_cost_approved_plus_adjustment',
    group: 'Financial data fields',
    input: false,
    overrideOptions: {
      minWidth: 200,
    },
  },
  supportCostBalance: {
    label: 'Support Cost Balance (US$)',
    fieldName: 'support_cost_balance',
    group: 'Financial data fields',
    input: false,
  },
  fundsDisbursed: {
    label: 'Funds Disbursed (US$)',
    fieldName: 'funds_disbursed',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  fundsCommitted: {
    label: 'Funds Committed (US$)',
    fieldName: 'funds_committed',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  estimatedDisbursementCurrentYear: {
    label: 'Estimated Disbursement in Current Year (US$)',
    fieldName: 'estimated_disbursement_current_year',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 200,
    },
  },
  supportCostDisbursed: {
    label: 'Support Cost Disbursed (US$)',
    fieldName: 'support_cost_disbursed',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  supportCostCommitted: {
    label: 'Support Cost Committed (US$)',
    fieldName: 'support_cost_committed',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  disbursementsMadeFinalBeneficiaries: {
    label: 'Disbursements made to final beneficiaries from FECO/MEP',
    fieldName: 'disbursements_made_to_final_beneficiaries',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 200,
    },
  },
  fundsAdvanced: {
    label: 'Funds advanced (US$)',
    fieldName: 'funds_advanced',
    group: 'Financial data fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  implementationDelays: {
    label: 'Implementation Delays/Status Report Decisions',
    fieldName: 'implementation_delays_status_report_decisions',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 150,
    },
  },
  dateCompletionPerAgreementOrDecision: {
    label: 'Date of Completion per Agreements or per Decisions',
    fieldName: 'date_of_completion_per_agreement_or_decisions',
    group: null,
    input: false,
    overrideOptions: {
      minWidth: 160,
    },
  },
  // Narrative & Indicators Data Fields
  remarksLastYear: {
    label: 'Remarks (as of 31 December XXXX)',
    fieldName: 'last_year_remarks',
    group: 'Narrative & Indicators Data Fields',
    input: true,
    overrideOptions: {
      minWidth: 120,
    },
  },
  remarksCurrentYear: {
    label: 'Remarks (Current year)',
    fieldName: 'current_year_remarks',
    group: 'Narrative & Indicators Data Fields',
    input: true,
  },
  genderPolicy: {
    label: 'Gender Policy for All Projects Approved from 85th Mtg (Yes/No)',
    fieldName: 'gender_policy',
    group: 'Narrative & Indicators Data Fields',
    input: true,
    overrideOptions: {
      minWidth: 200,
      cellClass: 'ag-cell-centered',
    },
  },
}

export default function getColumnDefs() {
  return {
    columnDefs: Object.values(tableColumns).map((c) => ({
      headerName: c.label,
      field: c.fieldName,
      tooltipField: c.fieldName,
      ...(c.overrideOptions ?? {}),
    })),
    defaultColDef: {
      headerClass: 'ag-text-center',
      cellClass: 'ag-text-center ag-cell-ellipsed',
      minWidth: 90,
      resizable: true,
      sortable: false,
    },
  }
}
