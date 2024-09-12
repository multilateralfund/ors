'use client'

import React, { useState } from 'react'

import { Typography } from '@mui/material'
import { filter, union } from 'lodash'

import Field from '@ors/components/manage/Form/Field'

import { IoClose } from 'react-icons/io5'

export default function ColumnsFilter({
  isCurrentStep,
  possibleColumns,
}: {
  isCurrentStep: boolean
  possibleColumns: any
}) {
  const [columns, setColumns] = useState<Array<any>>([])

  const getColumnsOptions = (options: any = []) => {
    if (columns.length === 0) {
      return options
    }

    const selectedColsIds = columns.map((column: any) => column.id)

    return options.filter((option: any) => !selectedColsIds.includes(option.id))
  }

  return isCurrentStep ? (
    <>
      <Field
        FieldProps={{ className: 'mb-0 w-40 min-w-40 BPList' }}
        Input={{ placeholder: 'Select columns' }}
        getOptionLabel={(option: any) => option?.name}
        options={getColumnsOptions(possibleColumns)}
        value={[]}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const newValue = union(columns, value)
          setColumns(newValue)
        }}
        multiple
      />

      <div className="flex flex-wrap items-center gap-4 md:flex-1">
        {columns?.map((column: any) => {
          return (
            <Typography
              key={column.id}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-0.5 font-normal theme-dark:bg-gray-700/20"
              component="p"
              variant="h6"
            >
              {column.name}
              <IoClose
                className="cursor-pointer"
                size={20}
                onClick={() => {
                  const newValue = filter(
                    columns,
                    (value) => value.id !== column.id,
                  )
                  setColumns(newValue)
                }}
              />
            </Typography>
          )
        })}

        {columns.length > 0 && (
          <Typography
            className="cursor-pointer content-center"
            color="secondary"
            component="span"
            onClick={() => {
              setColumns([])
            }}
          >
            Clear All
          </Typography>
        )}
      </div>
    </>
  ) : (
    <div className="flex flex-wrap items-center gap-4 self-center md:flex-1">
      {columns.length !== 0
        ? columns?.map((column: any) => {
            return (
              <Typography
                key={column.id}
                className="inline-flex items-center gap-2 self-center rounded-lg bg-gray-200 px-4 py-0.5 font-normal theme-dark:bg-gray-700/20"
                component="p"
                variant="h6"
              >
                {column.name}
              </Typography>
            )
          })
        : '-'}
    </div>
  )
}
