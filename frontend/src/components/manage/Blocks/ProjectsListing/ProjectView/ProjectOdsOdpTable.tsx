import { Dispatch, SetStateAction } from 'react'

import EditTable from '@ors/components/manage/Form/EditTable'
import {
  agFormatValue,
  getOptionLabel,
  isOptionEqualToValueByName,
} from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  ProjectSpecificFields,
  OdsOdpFields,
  FieldType,
  OptionsType,
  ProjectData,
} from '../interfaces'
import { formatNumberColumns, formatOptions } from '../utils'

import { IoTrash } from 'react-icons/io5'
import { find, findIndex, lowerCase, map } from 'lodash'
import cx from 'classnames'
import {
  ValueGetterParams,
  ITooltipParams,
  ICellRendererParams,
  GetRowIdParams,
  ValueFormatterParams,
} from 'ag-grid-community'

const ProjectOdsOdpTable = ({
  data,
  fields,
  mode,
  onRemoveOdsOdp = () => {},
  setProjectData,
  sectionIdentifier,
  field,
  errors,
  hasSubmitted,
}: {
  data: OdsOdpFields[]
  fields: ProjectSpecificFields[]
  mode?: string
  onRemoveOdsOdp?: (props: ICellRendererParams) => void
  setProjectData?: Dispatch<SetStateAction<ProjectData>>
  sectionIdentifier?: keyof ProjectData
  field?: string
  errors?: { [key: string]: string[] }
  hasSubmitted?: boolean
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
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          Input: { placeholder: `Select ${lowerCase(fieldObj.label)}` },
          agFormatValue,
          getOptionLabel: (option: any) =>
            getOptionLabel(fieldObj.options, option),
          isOptionEqualToValue: isOptionEqualToValueByName,
          options: fieldObj.options,
          openOnFocus: true,
        },
        valueGetter: (params: ValueGetterParams<OdsOdpFields>) =>
          getFieldName(params, options, field),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldName(params, options, field),
        editable: mode === 'edit',
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
        editable: mode === 'edit',
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
        editable: mode === 'edit',
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
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        dataType: 'number',
        valueFormatter: (params: ValueFormatterParams<OdsOdpFields>) =>
          formatNumberColumns(params, field),
        valueGetter: (params: ValueGetterParams<OdsOdpFields>) =>
          params.data?.[field],
        tooltipValueGetter: (params: ITooltipParams) =>
          formatNumberColumns(params, field, {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          }),
        cellRendererParams: () => ({
          tooltipClassName: 'odp-table-tooltip',
        }),
        editable: mode === 'edit',
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
        editable: mode === 'edit',
        initialWidth: 60,
        minWidth: 60,
        ...defaultColDef,
      }
    },
  }

  return (
    <EditTable
      rowData={data ?? []}
      results={[]}
      suppressScrollOnNewData={true}
      resizeGridOnRowUpdate={true}
      enablePagination={false}
      suppressCellFocus={true}
      withSeparators={true}
      singleClickEdit={true}
      className={cx('mb-4', {
        'projects-table ods-odp-table': mode === 'edit',
      })}
      onCellValueChanged={(event) => {
        const eventData = event.data
        const newData = [...data]

        const rowIndex = findIndex(
          newData,
          (row: OdsOdpFields & { id?: number }) => row.id === eventData.id,
        )

        if (rowIndex > -1) {
          newData.splice(rowIndex, 1, {
            ...eventData,
          })

          setProjectData?.((prevData) => ({
            ...prevData,
            [sectionIdentifier as keyof ProjectData]: {
              ...prevData[sectionIdentifier as keyof ProjectData],
              [field as string]: newData,
            },
          }))
        }
      }}
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
