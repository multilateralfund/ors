import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  ProjectSpecificFields,
  OdsOdpFields,
  FieldType,
  OptionsType,
} from '../interfaces'
import { formatNumberColumns, formatOptions } from '../utils'

import { IoTrash } from 'react-icons/io5'
import { find, map } from 'lodash'
import cx from 'classnames'
import {
  ValueGetterParams,
  ITooltipParams,
  ICellRendererParams,
  GetRowIdParams,
} from 'ag-grid-community'

const ProjectOdsOdpTable = ({
  data,
  fields,
  mode,
  onRemoveOdsOdp = () => {},
}: {
  data: OdsOdpFields[]
  fields: ProjectSpecificFields[]
  mode?: string
  onRemoveOdsOdp?: (props: ICellRendererParams) => void
}) => {
  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
  }

  const getFieldName = (
    params: ValueGetterParams | ITooltipParams,
    options: OptionsType[],
    field: string,
  ) => find(options, { id: params.data[field] })?.name

  const fieldColumnMapping = {
    drop_down: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.write_field_name
      const options = formatOptions(fieldObj)

      return {
        headerName: fieldObj.label,
        field: field,
        valueGetter: (params: ValueGetterParams<OdsOdpFields>) =>
          getFieldName(params, options, field),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldName(params, options, field),
        initialWidth: 140,
        minWidth: 140,
        ...defaultColDef,
      }
    },
    text: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.read_field_name

      return {
        headerName: fieldObj.label,
        field: field,
        tooltipField: field,
        initialWidth: 180,
        minWidth: 180,
        ...defaultColDef,
      }
    },
    number: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.read_field_name

      return {
        headerName: fieldObj.label,
        field: field,
        tooltipField: field,
        initialWidth: 80,
        minWidth: 80,
        ...defaultColDef,
      }
    },
    decimal: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.read_field_name

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
    boolean: (fieldObj: ProjectSpecificFields) => {
      const field = fieldObj.read_field_name

      return {
        headerName: fieldObj.label,
        field: field,
        valueGetter: (params: ValueGetterParams) =>
          params.data[field] ? 'Yes' : 'No',
        tooltipValueGetter: (params: ITooltipParams) =>
          params.data[field] ? 'Yes' : 'No',
        initialWidth: 60,
        minWidth: 60,
        ...defaultColDef,
      }
    },
  }

  return (
    <ViewTable
      rowData={data}
      resizeGridOnRowUpdate={true}
      enablePagination={false}
      suppressCellFocus={false}
      withSeparators={true}
      className={cx('mb-4', {
        'projects-table ods-odp-table': mode === 'edit',
      })}
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
        ...map(fields, (field) =>
          (
            fieldColumnMapping[field.data_type as FieldType] ??
            fieldColumnMapping['text']
          )(field),
        ),
      ]}
      getRowId={(props: GetRowIdParams) => props.data.id}
    />
  )
}

export default ProjectOdsOdpTable
