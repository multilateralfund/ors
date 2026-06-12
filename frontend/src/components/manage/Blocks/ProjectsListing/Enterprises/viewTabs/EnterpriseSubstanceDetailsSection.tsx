import { useContext } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping, substanceDetailsFields } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { formatNumberColumns } from '../../utils'
import { EnterpriseType } from '../interfaces'
import { ApiSubstance } from '@ors/types/api_substances'
import { ApiBlend } from '@ors/types/api_blends'

import { find, isNil, map, sumBy } from 'lodash'
import {
  GetRowIdParams,
  ITooltipParams,
  CellClassParams,
  ValueGetterParams,
} from 'ag-grid-community'

const EnterpriseSubstanceDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const { substances, blends } = useContext(ProjectsDataContext)

  const odsOdpData = enterprise.ods_odp ?? []

  const totalRow =
    odsOdpData.length > 0
      ? [
          {
            consumption: sumBy(
              odsOdpData,
              (ods_odp) => Number(ods_odp.consumption) || 0,
            ),
            selected_alternative: '-',
            chemical_phased_in_mt: sumBy(
              odsOdpData,
              (ods_odp) => Number(ods_odp.chemical_phased_in_mt) || 0,
            ),
          },
        ]
      : []

  const getOdsFieldValue = (params: ITooltipParams | ValueGetterParams) => {
    if (params.node?.rowPinned) {
      return 'TOTAL'
    }

    const odsSubstanceValue = params.data.ods_substance
    const field = odsSubstanceValue ? 'ods_substance' : 'ods_blend'
    const options: (ApiSubstance | ApiBlend)[] = odsSubstanceValue
      ? substances
      : blends
    const currentValueObj = find(options, { id: params.data[field] })

    return (
      currentValueObj?.name +
      (field === 'ods_blend'
        ? ` (${(currentValueObj as ApiBlend)?.composition})`
        : '')
    )
  }

  const getDecimalFieldValue = (
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
      valueGetter: (params: ValueGetterParams) =>
        getOdsFieldValue(params) || '-',
      tooltipValueGetter: (params: ITooltipParams) =>
        getOdsFieldValue(params) || '-',
      cellClassRules: {
        'font-bold': (params: CellClassParams) => !!params.node?.rowPinned,
      },
    },
    {
      headerName: enterpriseFieldsMapping.consumption,
      valueGetter: (params: ValueGetterParams) =>
        getDecimalFieldValue(params, 'consumption'),
      tooltipValueGetter: (params: ITooltipParams) =>
        getDecimalFieldValue(params, 'consumption'),
    },
    {
      headerName: enterpriseFieldsMapping.selected_alternative,
      field: 'selected_alternative',
      tooltipField: 'selected_alternative',
    },
    {
      headerName: enterpriseFieldsMapping.chemical_phased_in_mt,
      valueGetter: (params: ValueGetterParams) =>
        getDecimalFieldValue(params, 'chemical_phased_in_mt'),
      tooltipValueGetter: (params: ITooltipParams) =>
        getDecimalFieldValue(params, 'chemical_phased_in_mt'),
    },
  ]

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className={viewColumnsClassName}>
          {map(substanceDetailsFields, (field, index) => (
            <div key={index}>
              {numberDetailItem(
                enterpriseFieldsMapping[field],
                enterprise[field as keyof typeof enterprise] as string,
                'decimal',
              )}
            </div>
          ))}
        </div>
        <ViewTable
          className={odsOdpData.length > 0 ? 'enterprise-table' : ''}
          getRowId={(props: GetRowIdParams) => props.data.id}
          rowData={odsOdpData}
          defaultColDef={defaultColDef}
          columnDefs={columnDefs}
          pinnedBottomRowData={totalRow}
          domLayout="autoHeight"
          enablePagination={false}
          suppressCellFocus={true}
          withSeparators={true}
        />
      </div>
    </>
  )
}

export default EnterpriseSubstanceDetailsSection
