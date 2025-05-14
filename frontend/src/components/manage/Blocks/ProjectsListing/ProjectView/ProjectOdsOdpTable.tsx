import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  ProjectSpecificFields,
  OdsOdpFields,
  TableFieldType,
} from '../interfaces'
import { formatNumberColumns, formatOptions } from '../utils'

import {
  ValueGetterParams,
  ITooltipParams,
  ICellRendererParams,
} from 'ag-grid-community'
import { IoTrash } from 'react-icons/io5'
import { find, map } from 'lodash'

const ProjectOdsOdpTable = ({
  odsOdpFields,
  data,
  mode,
  onRemoveOdsOdp = () => {},
}: {
  odsOdpFields: ProjectSpecificFields[]
  data: OdsOdpFields[]
  mode?: string
  onRemoveOdsOdp?: (props: ICellRendererParams) => void
}) => {
  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
  }

  const getFieldName = (options: any[], params: any, field: string) =>
    find(options, { id: params.data[field] })?.name

  const fieldColumnMapping = {
    drop_down: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.field_name
      const options = formatOptions(fieldObj)

      return {
        headerName: fieldObj.label,
        field: field,
        valueGetter: (params: ValueGetterParams<OdsOdpFields>) =>
          getFieldName(options, params, field),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldName(options, params, field),
        initialWidth: 140,
        minWidth: 140,
        ...defaultColDef,
      }
    },
    text: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.field_name

      return {
        headerName: fieldObj.label,
        field: field,
        tooltipField: field,
        initialWidth: 180,
        minWidth: 180,
        ...defaultColDef,
      }
    },
    decimal: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.field_name

      return {
        headerName: fieldObj.label,
        field: field,
        valueGetter: (params: ValueGetterParams<OdsOdpFields>) =>
          formatNumberColumns(params, field),
        tooltipValueGetter: (params: ITooltipParams) =>
          formatNumberColumns(params, field, {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          }),
        cellRendererParams: () => ({
          tooltipClassName: 'odp-table-tooltip',
        }),
        initialWidth: 100,
        minWidth: 100,
        ...defaultColDef,
      }
    },
  }

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
                cellRenderer: (props: ICellRendererParams) => (
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
        ...map(odsOdpFields, (field) =>
          (
            fieldColumnMapping[field.data_type as TableFieldType] ??
            fieldColumnMapping['text']
          )(field),
        ),
      ]}
      getRowId={(props: any) => props.data.id}
    />
  )
}

export default ProjectOdsOdpTable
