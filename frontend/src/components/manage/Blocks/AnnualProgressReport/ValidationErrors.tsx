import React from 'react'
import { Alert } from '@mui/material'
import { IoBan } from 'react-icons/io5'

export default function ValidationErrors({
  validationErrors,
}: {
  validationErrors: Record<string, string[]>[]
}) {
  return (
    <Alert
      className="flex-1"
      icon={<IoBan size={24} />}
      severity="warning"
    >
      <ul className="m-0 p-0">
        {validationErrors.map((rowErrors, index) => {
          if (Object.keys(rowErrors).length === 0) {
            return <></>
          }

          return (
            <li>
              Row {index + 1}
              <ul className="ml-2 pl-2">
                {Object.entries(rowErrors).map(([header, errors]) => {
                  return (
                    <li>
                      <span className="font-bold">{header}</span>:{' '}
                      {errors.join(',')}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </Alert>
  )
}
