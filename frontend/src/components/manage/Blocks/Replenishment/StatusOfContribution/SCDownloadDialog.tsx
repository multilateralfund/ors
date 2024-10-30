import { useContext, useMemo, useState } from 'react'

import { Checkbox, FormGroup } from '@mui/material'
import { FormControlLabel } from '@mui/material'
import cx from 'classnames'
import { filter, join, range, split } from 'lodash'

import { SubmitButton } from '@ors/components/ui/Button/Button'
import Link from '@ors/components/ui/Link/Link'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

import FormEditDialog from '../FormEditDialog'
import { SCDownloadDialogProps } from './types'
import { scPeriodOptions } from './utils'

const SCDownloadDialog = (props: SCDownloadDialogProps) => {
  const { baseUrl, setIsDialogOpen, ...dialogProps } = props

  const currentYear = new Date().getFullYear()
  const yearsOptions = range(currentYear, currentYear - 10)

  const ctx = useContext(ReplenishmentContext)
  const periodOptions = scPeriodOptions(ctx.periods)

  const [years, setYears] = useState<Array<string>>([])
  const [trienniums, setTrienniums] = useState<Array<string>>([])

  const formattedYears = useMemo(() => join(years, ','), [years])
  const formattedTrienniums = useMemo(() => join(trienniums, ','), [trienniums])

  const url = useMemo(
    () =>
      formattedYears && formattedTrienniums
        ? `${baseUrl}?years=${formattedYears}&triennials=${formattedTrienniums}`
        : formattedYears
          ? `${baseUrl}?years=${formattedYears}`
          : formattedTrienniums
            ? `${baseUrl}?triennials=${formattedTrienniums}`
            : null,
    [formattedYears, formattedTrienniums, baseUrl],
  )

  const handleChangeYear = (event: any) => {
    const { checked, name } = event.target

    if (checked) {
      setYears([...years, name])
    } else {
      setYears(filter(years, (year) => year !== name))
    }
  }

  const handleChangeTriennium = (event: any) => {
    const { checked, name } = event.target
    const formattedName = split(name, '-')[0]

    if (checked) {
      setTrienniums([...trienniums, formattedName])
    } else {
      setTrienniums(
        filter(trienniums, (triennium) => triennium !== formattedName),
      )
    }
  }

  const handleCloseDialog = () => {
    setTimeout(() => {
      setIsDialogOpen(false)
      setYears([])
      setTrienniums([])
    }, 20)
  }

  return (
    <FormEditDialog
      title="Download status of the contribution:"
      withFooter={false}
      onCancel={handleCloseDialog}
      onSubmit={() => {}}
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
                      onChange={handleChangeYear}
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
                      onChange={handleChangeTriennium}
                    />
                  }
                />
              ))}
            </FormGroup>
          </div>
        )}
      </div>
      <Link
        className={cx(
          'mt-5 flex cursor-pointer items-center gap-x-2 text-primary no-underline',
          { 'pointer-events-none': !url },
        )}
        href={url ? formatApiUrl(url) : '#'}
        prefetch={false}
        target="_blank"
        onClick={handleCloseDialog}
        download
      >
        <SubmitButton className={cx({ 'opacity-45': !url })} type="button">
          Download
        </SubmitButton>
      </Link>
    </FormEditDialog>
  )
}

export default SCDownloadDialog
