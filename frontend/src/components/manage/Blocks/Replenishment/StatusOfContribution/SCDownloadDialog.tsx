import { useContext } from 'react'

import { Checkbox, FormGroup } from '@mui/material'
import { FormControlLabel } from '@mui/material'
import { range } from 'lodash'

import { SubmitButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import FormEditDialog from '../FormEditDialog'
import { SCDownloadDialogProps } from './types'
import { scPeriodOptions } from './utils'

const SCDownloadDialog = (props: SCDownloadDialogProps) => {
  const { handleSubmitEditDialog, ...dialogProps } = props

  const currentYear = new Date().getFullYear()
  const yearsOptions = range(currentYear, currentYear - 10)

  const ctx = useContext(ReplenishmentContext)
  const periodOptions = scPeriodOptions(ctx.periods)

  return (
    <FormEditDialog
      title="Download status of the contribution:"
      withFooter={false}
      onSubmit={handleSubmitEditDialog}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-7">
        {yearsOptions && yearsOptions.length > 0 && (
          <div>
            <div className="border-0 border-b-2 border-solid border-primary pb-1.5 uppercase text-primary">
              Select years
            </div>
            <FormGroup className="flex max-h-52 flex-row flex-wrap overflow-y-auto">
              {yearsOptions.map((year) => (
                <FormControlLabel
                  key={year}
                  className="w-fit"
                  label={year}
                  control={
                    <Checkbox
                      name={year.toString()}
                      color="secondary"
                      sx={{
                        color: 'black',
                      }}
                    />
                  }
                />
              ))}
            </FormGroup>
          </div>
        )}
        {periodOptions && periodOptions.length > 0 && (
          <div>
            <div className="border-0 border-b-2 border-solid border-primary pb-1.5 uppercase text-primary">
              Select trienniums
            </div>
            <FormGroup className="flex max-h-52 flex-row flex-wrap overflow-y-auto">
              {periodOptions.map((period) => (
                <FormControlLabel
                  key={period.value}
                  className="w-fit"
                  label={period.label}
                  control={
                    <Checkbox
                      name={period.label}
                      color="secondary"
                      sx={{
                        color: 'black',
                      }}
                    />
                  }
                />
              ))}
            </FormGroup>
          </div>
        )}
      </div>
      <SubmitButton className="mt-4">Download</SubmitButton>
    </FormEditDialog>
  )
}

export default SCDownloadDialog
