import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  ProjectSpecificFields,
  OdsOdpFields,
  FieldType,
  OptionsType,
} from '../interfaces'
import { formatNumberColumns, formatOptions } from '../utils'

import { cloneDeep, find, map } from 'lodash'
import {
  ValueGetterParams,
  ITooltipParams,
  GetRowIdParams,
} from 'ag-grid-community'

const ProjectOdsOdpTable = ({
  data,
  fields = [],
}: {
  data: OdsOdpFields[]
  fields: ProjectSpecificFields[]
}) => {
  const defaultColDef = {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-not-inline',
    resizable: true,
  }

  const hasCfc = data.some(
    (entry) => entry.ods_display_name?.toLowerCase() === 'cfc',
  )

  const getFormattedFields = () => {
    if (!hasCfc) return fields

    const index = fields.findIndex(
      (field) => field.write_field_name === 'ods_display_name',
    )
    if (index === -1) return fields

    const initialOdsNameField: ProjectSpecificFields = {
      ...cloneDeep(fields[index]),
      label: 'Ods display name',
      data_type: 'text',
    }

    return [
      ...fields.slice(0, index + 1),
      initialOdsNameField,
      ...fields.slice(index + 1),
    ]
  }

  const getFieldName = (
    params: ITooltipParams | ValueGetterParams,
    options: OptionsType[],
    field: string,
  ) => find(options, { name: params.data[field] })?.name

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
      rowData={data ?? []}
      enablePagination={false}
      suppressCellFocus={true}
      withSeparators={true}
      className="mb-4"
      columnDefs={[
        ...map(getFormattedFields(), (field) =>
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
