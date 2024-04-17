import { useMemo } from 'react'

import { Tooltip, Typography } from '@mui/material'
import { FaEdit } from '@react-icons/all-files/fa/FaEdit'
import { SuppressKeyboardEventParams } from 'ag-grid-community'
import cx from 'classnames'
import { filter, find, get, groupBy, includes, isObject } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Link from '@ors/components/ui/Link/Link'
import { getContrastText } from '@ors/helpers/Color/Color'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

function suppressUndo(params: SuppressKeyboardEventParams) {
  const event = params.event
  const key = event.key
  const suppress = key === 'z' && (event.ctrlKey || event.metaKey)

  return suppress
}

export function usePListingGridOptions() {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)

  const projectStatuses = useMemo(
    () => groupBy(projectSlice.statuses.data, 'id'),
    [projectSlice.statuses.data],
  )

  function agFormatValue(value: any) {
    return value?.id || ''
  }

  const gridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRenderer: (props: any) => {
            if (includes(['skeleton'], props.data.rowType)) {
              return <AgCellRenderer {...props} />
            }
            if (!props.data.id || !props.value) return null
            return (
              <Link
                className={cx(props.className)}
                href={`/projects/${props.data.id}`}
                prefetch={false}
              >
                {props.value}
              </Link>
            )
          },
          editable: false,
          field: 'code',
          headerName: 'Code',
        },
        {
          editable: false,
          field: 'code_legacy',
          headerName: 'Legacy code',
        },
        {
          editable: false,
          field: 'metaproject_code',
          headerName: 'Metaproject code',
        },
        {
          editable: false,
          field: 'cluster',
          headerName: 'Cluster',
        },
        {
          editable: false,
          field: 'metaproject_category',
          headerName: 'Metaproject category',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select project type' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(projectSlice.types.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(projectSlice.types.data, { id: option })?.name || ''
            },
            options: projectSlice.types.data,
          },
          cellRenderer: (props: any) => {
            return <AgCellRenderer {...props} value={props.data.project_type} />
          },
          field: 'project_type_id',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Project type',
        },
        {
          editable: false,
          field: 'project_type_legacy',
          headerName: 'Legacy project type',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select agency' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(commonSlice.agencies.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(commonSlice.agencies.data, { id: option })?.name || ''
            },
            options: commonSlice.agencies.data,
          },
          cellRenderer: (props: any) => {
            return <AgCellRenderer {...props} value={props.data.agency} />
          },
          field: 'agency_id',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Agency',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select sector' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(projectSlice.sectors.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(projectSlice.sectors.data, { id: option })?.name || ''
            },
            options: projectSlice.sectors.data,
          },
          cellRenderer: (props: any) => {
            return <AgCellRenderer {...props} value={props.data.sector} />
          },
          field: 'sector_id',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Sector',
        },
        {
          editable: false,
          field: 'sector_legacy',
          headerName: 'Legacy sector',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select subsector' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(projectSlice.subsectors.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(projectSlice.subsectors.data, { id: option })?.name || ''
            },
            getOptions: (params: any) => {
              const sector = get(params, 'data.sector')
              const sectorId = find(projectSlice.sectors.data, {
                name: sector,
              })?.id
              if (!sectorId) return []
              return filter(
                projectSlice.subsectors.data,
                (item) => item.sector_id === sectorId,
              )
            },
          },
          cellRenderer: (props: any) => {
            return <AgCellRenderer {...props} value={props.data.subsector} />
          },
          field: 'subsector_id',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title={
                  <>
                    <Typography>Double left click on a cell to edit</Typography>
                    <Typography>
                      Select a sector before updating subsector
                    </Typography>
                  </>
                }
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Subsector',
        },
        {
          editable: false,
          field: 'subsector_legacy',
          headerName: 'Legacy subsector',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select substance type' },
            agFormatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: commonSlice.settings.data?.project_substance_types.map(
              (obj: Array<string>) => ({ id: obj[0], name: obj[1] }),
            ),
          },
          field: 'substance_type',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Substance type',
        },
        {
          editable: false,
          field: 'substance_name',
          headerName: 'Substance',
        },
        {
          field: 'title',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Title',
          initialWidth: 300,
          suppressAutoSize: true,
          tooltip: true,
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select status' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(projectSlice.statuses.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(projectSlice.statuses.data, { id: option })?.name || ''
            },
            options: filter(projectSlice.statuses.data, (item) => {
              return item.code !== 'NEWSUB'
            }),
          },
          cellRenderer: (props: any) => {
            const status = projectStatuses[props.data.status_id]?.[0]
            return (
              <AgCellRenderer
                {...props}
                value={
                  <span
                    className={cx('relative rounded bg-primary p-1', {
                      'animate-pulse': status?.code === 'ONG',
                    })}
                    style={
                      status
                        ? {
                            backgroundColor: status.color,
                            color: getContrastText({
                              background: status.color,
                            }),
                          }
                        : {}
                    }
                  >
                    {props.data.status}
                  </span>
                }
              />
            )
          },
          field: 'status_id',
          headerComponentParams: {
            className: 'flex justify-center gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Status',
        },
        {
          editable: false,
          field: 'country',
          headerName: 'Country',
          initialWidth: 150,
        },
        {
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            getFormattedValue: (value: any) => {
              return parseNumber(value || 0)?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })
            },
            min: 0,
          },
          dataType: 'number',
          field: 'funds_allocated',
          headerComponentParams: {
            className: 'flex justify-center2 gap-2',
            details: (
              <Tooltip
                placement="top"
                title="Double left click on a cell to edit"
              >
                <span className="flex items-center gap-1">
                  <FaEdit size={16} />
                </span>
              </Tooltip>
            ),
          },
          headerName: 'Funds allocated',
        },
      ],
      defaultColDef: {
        // autoHeight: true,
        editable: true,
        headerClass: 'ag-text-center',
        initialWidth: 100,
        minWidth: 100,
        resizable: true,
        // tooltip: true,
        // wrapText: true,
        suppressKeyboardEvent: (params: any) => {
          return suppressUndo(params)
        },
      },
    }),
    [commonSlice, projectSlice, projectStatuses],
  )

  return gridOptions
}
