import { useContext } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { enterpriseFieldsMapping } from '../constants'
import { PEnterpriseType } from '../../interfaces'
import { formatNumberColumns } from '../../utils'
import { ApiSubstance } from '@ors/types/api_substances'
import { ApiBlend } from '@ors/types/api_blends'

import { find, isNil, sumBy } from 'lodash'
import {
  CellClassParams,
  GetRowIdParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'

const PEnterpriseSubstanceDetailsSection = ({
  enterprise,
}: {
  enterprise: PEnterpriseType
}) => {
  const { substances, blends } = useContext(ProjectsDataContext)

  const odsOdpData = enterprise.ods_odp ?? []

  const getFieldValue = (params: ITooltipParams | ValueGetterParams) => {
    if (params.node?.rowPinned) {
      return 'TOTAL'
    }

    const options: (ApiSubstance | ApiBlend)[] = params.data.ods_substance
      ? substances
      : blends
    const field = params.data.ods_substance ? 'ods_substance' : 'ods_blend'
    const currentValueObj = find(options, { id: params.data[field] })

    return (
      currentValueObj?.name +
      (field === 'ods_blend' ? (currentValueObj as ApiBlend)?.composition : '')
    )
  }

  const totalRow =
    odsOdpData.length > 0
      ? [
          {
            consumption: sumBy(
              odsOdpData,
              (ods_odp) => Number(ods_odp.consumption) || 0,
            ),
            selected_alternative: '-',
            chemical_phased_in: sumBy(
              odsOdpData,
              (ods_odp) => Number(ods_odp.chemical_phased_in) || 0,
            ),
          },
        ]
      : []

  const getDecimalValue = (
    params: ValueGetterParams | ITooltipParams,
    field: string,
  ) => (!isNil(params.data[field]) ? formatNumberColumns(params, field) : '')

  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
    minWidth: 210,
  }

  const columnDefs = [
    {
      headerName: enterpriseFieldsMapping.ods_substance,
      valueGetter: (params: ValueGetterParams) => getFieldValue(params) || '-',
      tooltipValueGetter: (params: ITooltipParams) =>
        getFieldValue(params) || '-',
      cellClassRules: {
        'font-bold': (params: CellClassParams) => !!params.node?.rowPinned,
      },
    },
    {
      headerName: enterpriseFieldsMapping.consumption,
      valueGetter: (params: ValueGetterParams) =>
        getDecimalValue(params, 'consumption'),
      tooltipValueGetter: (params: ITooltipParams) =>
        getDecimalValue(params, 'consumption'),
    },
    {
      headerName: enterpriseFieldsMapping.selected_alternative,
      field: 'selected_alternative',
      tooltipField: 'selected_alternative',
    },
    {
      headerName: enterpriseFieldsMapping.chemical_phased_in,
      valueGetter: (params: ValueGetterParams) =>
        getDecimalValue(params, 'chemical_phased_in'),
      tooltipValueGetter: (params: ITooltipParams) =>
        getDecimalValue(params, 'chemical_phased_in'),
    },
  ]

  return (
    <ViewTable
      getRowId={(props: GetRowIdParams) => props.data.id}
      rowData={odsOdpData}
      defaultColDef={defaultColDef}
      columnDefs={columnDefs}
      pinnedBottomRowData={totalRow}
      className={odsOdpData.length > 0 ? 'enterprise-table' : ''}
      domLayout="autoHeight"
      enablePagination={false}
      suppressCellFocus={true}
      withSeparators={true}
    />
  )
}

export default PEnterpriseSubstanceDetailsSection
