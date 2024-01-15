import { useRef, useState } from 'react'

import { Alert, IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { findIndex, groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import useGridOptions from './schema'

import { AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoExpand } from 'react-icons/io5'

export default function AdmBCreate(props: any) {
  const { TableProps, emptyForm, form, section, setForm } = props
  const { columns = [], rows = [] } = emptyForm.adm_b || {}
  const grid = useRef<any>()
  const [initialRowData] = useState(() => {
    const dataByRowId = groupBy(form.adm_b, 'row_id')

    return map(rows, (row) => ({
      row_id: row.id,
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
    }))
  })

  const gridOptions = useGridOptions({
    adm_columns: columns,
  })

  return (
    <>
      <Alert className="mb-4" icon={false} severity="info">
        <Typography>
          Edit by pressing double left-click or ENTER on a field.
        </Typography>
      </Alert>
      <Table
        {...TableProps}
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={2}
        rowData={initialRowData}
        Toolbar={({
          enterFullScreen,
          exitFullScreen,
          fullScreen,
          onPrint,
          print,
        }: any) => {
          return (
            <div
              className={cx('mb-2 flex', {
                'flex-col': !fullScreen,
                'flex-col-reverse md:flex-row md:items-center md:justify-between md:py-2':
                  fullScreen,
                'px-4': fullScreen && !print,
              })}
            >
              <Typography className="mb-2" component="h2" variant="h6">
                {section.title}
              </Typography>
              <div className="flex items-center justify-end">
                <div>
                  {!fullScreen && (
                    <Dropdown
                      color="primary"
                      label={<IoDownloadOutline />}
                      icon
                    >
                      <Dropdown.Item onClick={onPrint}>
                        <div className="flex items-center gap-x-2">
                          <AiFillFilePdf className="fill-red-700" size={24} />
                          <span>PDF</span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown>
                  )}
                  {section.allowFullScreen && !fullScreen && (
                    <IconButton
                      color="primary"
                      onClick={() => {
                        enterFullScreen()
                      }}
                    >
                      <IoExpand />
                    </IconButton>
                  )}
                  {fullScreen && (
                    <div>
                      <IconButton
                        className="exit-fullscreen not-printable p-2 text-primary"
                        aria-label="exit fullscreen"
                        onClick={() => {
                          exitFullScreen()
                        }}
                      >
                        <IoClose size={32} />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.adm_b]
          const index = findIndex(
            newData,
            (row: any) => row.row_id === event.data.row_id,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, adm_b: newData })
          }
        }}
        onRowDataUpdated={() => {}}
      />
    </>
  )
}
