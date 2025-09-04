import ViewTable from '@ors/components/manage/Form/ViewTable'
import { EnterpriseType } from '../../interfaces'
import { formatNumberColumns } from '../../utils'
import { tableColumns } from '../../constants'
import { ApiSubstance } from '@ors/types/api_substances'
import { ApiBlend } from '@ors/types/api_blends'
import { useStore } from '@ors/store'

import { find } from 'lodash'
import {
  GetRowIdParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'

const PEnterprisesSubstanceDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const { substances, blends } = useStore((state) => state.cp_reports)

  const getFieldValue = (params: ITooltipParams | ValueGetterParams) => {
    const options: (ApiSubstance | ApiBlend)[] = params.data.ods_substance
      ? substances.data
      : blends.data
    const field = params.data.ods_substance ? 'ods_substance' : 'ods_blend'

    return find(options, { id: params.data[field] })?.name
  }

  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
    minWidth: 90,
  }

  const columnDefs = [
    {
      headerName: tableColumns.ods_substance,
      valueGetter: (params: ValueGetterParams) => getFieldValue(params),
      tooltipValueGetter: (params: ITooltipParams) => getFieldValue(params),
    },
    {
      headerName: tableColumns.phase_out_mt,
      valueGetter: (params: ValueGetterParams) =>
        formatNumberColumns(params, 'phase_out_mt'),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatNumberColumns(params, 'phase_out_mt', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        }),
    },
    {
      headerName: tableColumns.ods_replacement,
      field: 'ods_replacement',
      tooltipField: 'ods_replacement',
    },
    {
      headerName: tableColumns.ods_replacement_phase_in,
      valueGetter: (params: ValueGetterParams) =>
        formatNumberColumns(params, 'ods_replacement_phase_in'),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatNumberColumns(params, 'ods_replacement_phase_in', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        }),
    },
  ]

  return (
    <ViewTable
      getRowId={(props: GetRowIdParams) => props.data.id}
      rowData={enterprise.ods_odp ?? []}
      defaultColDef={defaultColDef}
      columnDefs={columnDefs}
      enablePagination={false}
      suppressCellFocus={true}
      withSeparators={true}
    />
  )
}

export default PEnterprisesSubstanceDetailsSection
