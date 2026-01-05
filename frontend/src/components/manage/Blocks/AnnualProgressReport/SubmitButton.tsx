import React from 'react'
import Button from '@mui/material/Button'
import { useConfirmation } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { api } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import { handleActionErrors } from '@ors/components/manage/Blocks/AnnualProgressReport/errors.ts'

interface SubmitButtonProps {
  revalidateData: () => void
  year: string | undefined
  agencyId: number
  disabled: boolean
}

function SubmitButton({
  revalidateData,
  year,
  agencyId,
  disabled,
}: SubmitButtonProps) {
  const confirm = useConfirmation()

  const submit = async () => {
    const response = await confirm({
      title: 'APR Submission',
      message:
        'Are you sure you want to submit your agency Annual Progress Report?',
    })

    if (!response) {
      return
    }

    try {
      await api(
        `api/annual-project-report/${year}/agency/${agencyId}/status/`,
        {
          method: 'POST',
        },
      )

      revalidateData()
      enqueueSnackbar(<>Submitted APR.</>, {
        variant: 'success',
      })
    } catch (e) {
      await handleActionErrors(e)
    }
  }

  return (
    <Button variant="contained" onClick={submit} disabled={disabled}>
      Submit
    </Button>
  )
}

export default SubmitButton
