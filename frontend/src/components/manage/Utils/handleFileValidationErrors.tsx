import { enqueueSnackbar } from 'notistack'
import React from 'react'

interface FileValidationError {
  validation_error: string
  files: {
    name: string
    error: string
  }[]
}

const handleFileValidationErrors = (error: FileValidationError) => {
  const errMsg = (
    <div>
      <div className="">{error.validation_error}</div>
      <ul className="m-0 list-none p-0">
        {error.files.map(
          ({ name, error }: { name: string; error: string }, idx) => (
            <li key={`${name}-${idx}`}>
              <strong>{name}</strong>: {error}
            </li>
          ),
        )}
      </ul>
    </div>
  )
  enqueueSnackbar(errMsg, {
    variant: 'error',
  })
}

export default handleFileValidationErrors
