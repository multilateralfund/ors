import { enqueueSnackbar } from 'notistack'
import { isString } from 'lodash'

function showError(message: string) {
  enqueueSnackbar(message, {
    variant: 'error',
  })
}

function handleUnrecoverableError() {
  showError('An error occurred. Please try again.')
}

function isRecoverableError(error: unknown): error is Response {
  return error instanceof Response && error.status !== 500
}

export async function handleActionErrors(error: unknown) {
  if (!isRecoverableError(error)) {
    handleUnrecoverableError()
    return
  }

  try {
    const errorDetails = await error.json()

    if (Array.isArray(errorDetails)) {
      showError(errorDetails.join(' '))
    }

    if (isString(errorDetails)) {
      showError(errorDetails)
    }

    if (errorDetails.detail) {
      showError(errorDetails.detail)
    }

    if (errorDetails.non_field_errors) {
      showError(errorDetails.non_field_errors.join(' '))
    }
  } catch (e) {
    handleUnrecoverableError()
  }
}
