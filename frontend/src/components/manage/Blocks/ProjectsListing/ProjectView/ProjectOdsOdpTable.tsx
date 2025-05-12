import ViewTable from '@ors/components/manage/Form/ViewTable'
import { odsTypeOpts, tableColumns } from '../constants'
import { formatNumberColumns } from '../utils'
import { OdsOdpFields } from '../interfaces'
import { useStore } from '@ors/store'

import { ITooltipParams } from 'ag-grid-community'
import { IoTrash } from 'react-icons/io5'
import { find } from 'lodash'

const ProjectOdsOdpTable = ({
  data,
  mode,
  onRemoveOdsOdp = () => {},
}: {
  data: OdsOdpFields[]
  mode?: string
  onRemoveOdsOdp?: (props: any) => void
}) => {
  const cpReportsSlice = useStore((state) => state.cp_reports)
  const substances = cpReportsSlice.substances.data

  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
  }

  const getFieldName = (options: any[], params: any, field: string) =>
    find(options, { id: params.data[field] })?.name

  return (
    <ViewTable
      className="projects-table mb-4"
      rowData={data}
      resizeGridOnRowUpdate={true}
      enablePagination={false}
      suppressCellFocus={false}
      withSeparators={true}
      columnDefs={[
        ...(mode === 'edit'
          ? [
              {
                field: '',
                cellRenderer: (props: any) => (
                  <IoTrash
                    className="cursor-pointer fill-gray-400"
                    size={16}
                    onClick={() => {
                      onRemoveOdsOdp(props)
                    }}
                  />
                ),
                resizable: false,
                minWidth: 20,
                maxWidth: 20,
              },
            ]
          : []),
        {
          headerName: tableColumns.ods_substance_id,
          field: 'ods_substance_id',
          valueGetter: (params: any) =>
            getFieldName(substances, params, 'ods_substance_id'),
          tooltipValueGetter: (params: ITooltipParams) =>
            getFieldName(substances, params, 'ods_substance_id'),
          initialWidth: 140,
          minWidth: 140,
          ...defaultColDef,
        },
        {
          headerName: tableColumns.ods_replacement,
          field: 'ods_replacement',
          tooltipField: 'ods_replacement',
          initialWidth: 180,
          minWidth: 180,
          ...defaultColDef,
        },
        {
          headerName: tableColumns.co2_mt,
          field: 'co2_mt',
          valueGetter: (params: any) => formatNumberColumns(params, 'co2_mt'),
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'co2_mt', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
          cellRendererParams: () => ({
            tooltipClassName: 'bp-table-tooltip',
          }),
          initialWidth: 100,
          minWidth: 100,
          ...defaultColDef,
        },
        {
          headerName: tableColumns.odp,
          field: 'odp',
          valueGetter: (params: any) => formatNumberColumns(params, 'odp'),
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'odp', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
          cellRendererParams: () => ({
            tooltipClassName: 'bp-table-tooltip',
          }),
          initialWidth: 100,
          minWidth: 100,
          ...defaultColDef,
        },
        {
          headerName: tableColumns.phase_out_mt,
          field: 'phase_out_mt',
          valueGetter: (params: any) =>
            formatNumberColumns(params, 'phase_out_mt'),
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'phase_out_mt', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
          cellRendererParams: () => ({
            tooltipClassName: 'bp-table-tooltip',
          }),
          initialWidth: 100,
          minWidth: 100,
          ...defaultColDef,
        },
        {
          headerName: tableColumns.ods_type,
          field: 'ods_type',
          valueGetter: (params: any) =>
            getFieldName(odsTypeOpts, params, 'ods_type'),
          tooltipValueGetter: (params: ITooltipParams) =>
            getFieldName(odsTypeOpts, params, 'ods_type'),
          initialWidth: 100,
          minWidth: 100,
          ...defaultColDef,
        },
      ]}
      getRowId={(props: any) => {
        return props.data.id
      }}
    />
  )
}

export default ProjectOdsOdpTable
