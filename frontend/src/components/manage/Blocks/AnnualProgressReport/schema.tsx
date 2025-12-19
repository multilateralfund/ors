import { AgGridReactProps, CustomCellRendererProps } from 'ag-grid-react'
import { DataTypeDefinition, IHeaderParams } from 'ag-grid-community'
import {
  formatBoolean,
  formatDate,
  formatDecimal,
  formatPercent,
  formatUSD,
  parseDate,
} from '@ors/components/manage/Blocks/AnnualProgressReport/utils.ts'
import React from 'react'
import { HeaderPasteWrapper } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport/HeaderPasteWrapper.tsx'
import { useStore } from '@ors/store.tsx'
import { get, isEqual, isObject } from 'lodash'
import {
  validateDate,
  validateNumber,
  validateText,
  ValidatorMixin,
} from '@ors/components/manage/Blocks/AnnualProgressReport/validation.tsx'
import CellValidation from '@ors/components/manage/Blocks/AnnualProgressReport/CellValidation.tsx'

export const dataTypeDefinitions: Record<
  string,
  DataTypeDefinition & ValidatorMixin
> = {
  dateString: {
    baseDataType: 'dateString',
    extendsDataType: 'dateString',
    // From date picker to our ISO format (YYYY-MM-DD)
    dateFormatter: (value) => formatDate(value, 'YYYY-MM-DD'),
    // Format value to UI format (DD/MM/YYYY)
    valueFormatter: (params) => formatDate(params.value),
    // Parse to date from ISO format
    dateParser: (value) => parseDate(value),
    validators: [validateDate],
  },
  currency: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatUSD(params.value),
    validators: [validateNumber],
  },
  percent: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatPercent(params.value),
    validators: [validateNumber],
  },
  decimal: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatDecimal(params.value),
    validators: [validateNumber],
  },
  boolean: {
    baseDataType: 'boolean',
    extendsDataType: 'boolean',
    valueFormatter: (params) => formatBoolean(params.value),
  },
}

interface APRTableColumn {
  label: string
  fieldName: string
  group: string | null
  input: boolean
  overrideOptions?: NonNullable<AgGridReactProps['columnDefs']>[number] &
    ValidatorMixin
}

interface BaseColumnDefOptions {
  inlineEdit?: boolean
  year: string
}

interface ClipboardDisabled extends BaseColumnDefOptions {
  clipboardEdit?: false
  rows?: undefined
  setRows?: undefined
}

interface ClipboardEnabled extends BaseColumnDefOptions {
  clipboardEdit: true
  rows: any[]
  setRows: (state: any[]) => void
}

type ColumnDefOptions = ClipboardDisabled | ClipboardEnabled

export default function useGetColumnDefs({
  year,
  inlineEdit = false,
  clipboardEdit = false,
  rows,
  setRows,
}: ColumnDefOptions) {
  const {
    statuses: { data: projectStatuses },
  } = useStore((state) => state.projects)

  const tableColumns: Record<string, APRTableColumn> = {
    pcrDue: {
      label: 'PCR Due',
      fieldName: 'pcr_due',
      group: null,
      input: false,
      overrideOptions: {
        cellDataType: 'boolean',
        cellRenderer: (params: CustomCellRendererProps) => (
          <>{params.valueFormatted}</>
        ),
      },
    },
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
        valueFormatter: (params) => {
          if (!params.value) {
            return '-'
          }

          return params.value
        },
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
      overrideOptions: {
        cellDataType: 'dateString',
      },
    },
    dateCompletionProposal: {
      label: 'Date of Completion per Proposal',
      fieldName: 'date_completion_proposal',
      group: 'Date data fields',
      input: false,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'dateString',
      },
    },
    status: {
      label: 'Status',
      fieldName: 'status',
      group: 'Date data fields',
      input: true,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'text',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          Input: { placeholder: 'Select status' },
          openOnFocus: true,
          allowEmptyStringOnClear: true,
          options: projectStatuses,
          getOptionLabel: (option: any) =>
            isObject(option)
              ? get(option, 'name')
              : (projectStatuses.find((status) => status.name === option)
                  ?.name ?? ''),
          isOptionEqualToValue: (option: any, value: any) =>
            isObject(value) ? isEqual(option, value) : option.name === value,
          agFormatValue: (value: any) => value?.name || '',
        },
        validators: [
          (value: any) => {
            const status = projectStatuses.find(
              (status) => status.name === value,
            )

            return status ? null : 'Invalid status option'
          },
        ],
      },
    },
    firstDisbursementDate: {
      label: 'First Disbursement Date',
      fieldName: 'date_first_disbursement',
      group: 'Date data fields',
      input: true,
      overrideOptions: {
        minWidth: 140,
        cellDataType: 'dateString',
      },
    },
    plannedDateOfCompletion: {
      label: 'Planned Date of Completion',
      fieldName: 'date_planned_completion',
      group: 'Date data fields',
      input: true,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'dateString',
      },
    },
    dateCompletedActual: {
      label: 'Date Completed (Actual)',
      fieldName: 'date_actual_completion',
      group: 'Date data fields',
      input: true,
      overrideOptions: {
        minWidth: 140,
        cellDataType: 'dateString',
      },
    },
    dateFinancialCompletion: {
      label: 'Date of Financial Completion',
      fieldName: 'date_financial_completion',
      group: 'Date data fields',
      input: true,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'dateString',
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
        cellDataType: 'decimal',
      },
    },
    consumptionODPCO2Proposal: {
      label: 'Consumption to be Phased Out per Proposal in CO2-eq Tonnes',
      fieldName: 'consumption_phased_out_co2_proposal',
      group: 'Phaseout data fields',
      input: false,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'decimal',
      },
    },
    productionODPMTProposal: {
      label: 'Production ODP/MT to be Phased Out per Proposal',
      fieldName: 'production_phased_out_odp_proposal',
      group: 'Phaseout data fields',
      input: false,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'decimal',
      },
    },
    productionODPCO2Proposal: {
      label: 'Production to be Phased Out per Proposal in CO2-eq Tonnes',
      fieldName: 'production_phased_out_co2_proposal',
      group: 'Phaseout data fields',
      input: false,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'decimal',
      },
    },
    consumptionODPMTActual: {
      label: 'Consumption ODP/MT Phased Out',
      fieldName: 'consumption_phased_out_odp',
      group: 'Phaseout data fields',
      input: true,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'decimal',
      },
    },
    consumptionODPCO2Actual: {
      label: 'Consumption Phased Out in CO2-eq Tonnes',
      fieldName: 'consumption_phased_out_co2',
      group: 'Phaseout data fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'decimal',
      },
    },
    productionODPMTActual: {
      label: 'Production ODP/MT Phased Out',
      fieldName: 'production_phased_out_odp',
      group: 'Phaseout data fields',
      input: true,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'decimal',
      },
    },
    productionODPCO2Actual: {
      label: 'Production Phased Out in CO2-eq Tonnes',
      fieldName: 'production_phased_out_co2',
      group: 'Phaseout data fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'decimal',
      },
    },
    // Financial data fields
    approvedFunding: {
      label: 'Approved Funding (US$)',
      fieldName: 'approved_funding',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        cellDataType: 'currency',
      },
    },
    adjustment: {
      label: 'Adjustment (US$)',
      fieldName: 'adjustment',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        cellDataType: 'currency',
      },
    },
    approvedFundingPlusAdjustment: {
      label: 'Approved Funding plus Adjustments (US$)',
      fieldName: 'approved_funding_plus_adjustment',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'currency',
      },
    },
    percentFundsDisbursed: {
      label: 'Per Cent of Funds Disbursed',
      fieldName: 'per_cent_funds_disbursed',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'percent',
      },
    },
    balance: {
      label: 'Balance (US$)',
      fieldName: 'balance',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        cellDataType: 'currency',
      },
    },
    supportCostApproved: {
      label: 'Support Cost Approved (US$)',
      fieldName: 'support_cost_approved',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'currency',
      },
    },
    supportCostAdjustment: {
      label: 'Support Cost Adjustment (US$)',
      fieldName: 'support_cost_adjustment',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'currency',
      },
    },
    supportCostProposedPlusAdjustment: {
      label: 'Support Costs Approved Funding plus Adjustments (US$)',
      fieldName: 'support_cost_approved_plus_adjustment',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'currency',
      },
    },
    supportCostBalance: {
      label: 'Support Cost Balance (US$)',
      fieldName: 'support_cost_balance',
      group: 'Financial data fields',
      input: false,
      overrideOptions: {
        cellDataType: 'currency',
      },
    },
    fundsDisbursed: {
      label: 'Funds Disbursed (US$)',
      fieldName: 'funds_disbursed',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'currency',
      },
    },
    fundsCommitted: {
      label: 'Funds Committed (US$)',
      fieldName: 'funds_committed',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 140,
        cellDataType: 'currency',
      },
    },
    estimatedDisbursementCurrentYear: {
      label: 'Estimated Disbursement in Current Year (US$)',
      fieldName: 'estimated_disbursement_current_year',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'currency',
      },
    },
    supportCostDisbursed: {
      label: 'Support Cost Disbursed (US$)',
      fieldName: 'support_cost_disbursed',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'currency',
      },
    },
    supportCostCommitted: {
      label: 'Support Cost Committed (US$)',
      fieldName: 'support_cost_committed',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 140,
        cellDataType: 'currency',
      },
    },
    disbursementsMadeFinalBeneficiaries: {
      label: 'Disbursements made to final beneficiaries from FECO/MEP',
      fieldName: 'disbursements_made_to_final_beneficiaries',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'currency',
      },
    },
    fundsAdvanced: {
      label: 'Funds advanced (US$)',
      fieldName: 'funds_advanced',
      group: 'Financial data fields',
      input: true,
      overrideOptions: {
        minWidth: 120,
        cellDataType: 'currency',
      },
    },
    implementationDelays: {
      label: 'Implementation Delays/Status Report Decisions',
      fieldName: 'implementation_delays_status_report_decisions',
      group: null,
      input: false,
      overrideOptions: {
        minWidth: 200,
      },
    },
    dateCompletionPerAgreementOrDecision: {
      label: 'Date of Completion per Agreements or per Decisions',
      fieldName: 'date_of_completion_per_agreement_or_decisions',
      group: null,
      input: false,
      overrideOptions: {
        minWidth: 160,
        cellDataType: 'dateString',
      },
    },
    // Narrative & Indicators Data Fields
    remarksLastYear: {
      label: `Remarks (as of 31 December ${parseInt(year, 10) - 1})`,
      fieldName: 'last_year_remarks',
      group: 'Narrative & Indicators Data Fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'text',
        validators: [validateText],
        cellClass: 'ag-cell-ellipsed',
      },
    },
    remarksCurrentYear: {
      label: 'Remarks (Current year)',
      fieldName: 'current_year_remarks',
      group: 'Narrative & Indicators Data Fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'text',
        validators: [validateText],
        cellClass: 'ag-cell-ellipsed',
      },
    },
    genderPolicy: {
      label: 'Gender Policy for All Projects Approved from 85th Mtg (Yes/No)',
      fieldName: 'gender_policy',
      group: 'Narrative & Indicators Data Fields',
      input: true,
      overrideOptions: {
        minWidth: 200,
        cellDataType: 'boolean',
      },
    },
  }

  const columns = Object.values(tableColumns)
  const columnDefs = columns.map((c) => {
    const canBeEdited = c.input && (clipboardEdit || inlineEdit)

    return {
      headerName: c.label,
      field: c.fieldName,
      editable: inlineEdit && c.input,
      canBeEdited,
      group: c.group,
      // Clipboard editing requires a custom header component
      headerComponent:
        clipboardEdit && c.input && rows && setRows
          ? (props: IHeaderParams) => (
              <HeaderPasteWrapper
                field={props.column.getColDef().field!}
                form={rows}
                label={props.displayName}
                setForm={setRows}
                rowIdField="project_code"
              />
            )
          : undefined,
      cellRenderer: canBeEdited ? CellValidation : undefined,
      ...(c.overrideOptions ?? {}),
    }
  })

  return {
    columnDefs,
    defaultColDef: {
      headerClass: 'ag-text-center',
      cellClass: 'ag-text-center ag-cell-ellipsed',
      minWidth: 90,
      resizable: true,
      sortable: false,
      // Use any because it could theoretically be a colgroup definition and too
      // much narrowing is required
      tooltipValueGetter: (params: any) => {
        return params.valueFormatted ?? params.value
      },
    },
  }
}
