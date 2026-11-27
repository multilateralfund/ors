import { Dispatch, SetStateAction, useContext, useState } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useEditPCR } from './useEditPCR'

import { Button, CircularProgress } from '@mui/material'
import cx from 'classnames'

const PCREditSectionButtons = ({
  section,
  hasNextTab,
  setCurrentTab,
}: {
  section: string
  hasNextTab: boolean
  setCurrentTab: Dispatch<SetStateAction<number>>
}) => {
  const { pcrMetaproject } = useContext(PCRDataContext)

  const [isLoading, setIsLoading] = useState(false)

  const editPCR = useEditPCR(setIsLoading)

  const isDisabled = isLoading || !pcrMetaproject.data?.id

  const saveAndNext = async () => {
    const isSaved = await editPCR(true, section)

    if (isSaved) {
      setCurrentTab((tab) => tab + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      {isLoading && <CircularProgress color="inherit" size="30px" />}
      <Button
        className={cx('!h-10 border px-3 py-1 uppercase leading-none', {
          'border-solid border-primary bg-white text-primary': !isDisabled,
        })}
        size="large"
        variant="contained"
        disabled={isDisabled}
        onClick={() => editPCR(true, section)}
      >
        Save draft
      </Button>
      {hasNextTab && (
        <Button
          className={cx('!h-10 border px-3 py-1 uppercase leading-none', {
            '!border-primary !bg-primary !text-mlfs-hlYellow': !isDisabled,
          })}
          size="large"
          variant="contained"
          disabled={isDisabled}
          onClick={saveAndNext}
        >
          Save and next
        </Button>
      )}
    </>
  )
}

export default PCREditSectionButtons
