import { useContext, useEffect, useState } from 'react'

import Big from 'big.js'
import { reverse } from 'lodash'
import { useSnackbar } from 'notistack'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'
import { Input } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import {
  SaveData,
  SaveManagerProps,
} from '@ors/components/manage/Blocks/Replenishment/SAView/types'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { encodeFileForUpload } from '@ors/components/manage/Blocks/Replenishment/utils'
import { SubmitButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import SoAContext from '@ors/contexts/Replenishment/SoAContext'
import { api } from '@ors/helpers'
import { useStore } from '@ors/store'

export function SaveManager(props: SaveManagerProps) {
  const { comment, currencyDateRange, data, replenishment, version, versions } =
    props

  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
    year: meeting.date ? new Date(meeting.date).getFullYear() : '-',
  }))
  const meetingOptions = reverse(formattedMeetings)

  const { refetchData: refetchReplenishment } = useContext(ReplenishmentContext)
  const { refetchData: refetchSoA, setCurrentVersion } = useContext(SoAContext)
  const ctx = useContext(ReplenishmentContext)

  const [isFinal, setIsFinal] = useState(false)
  const [createNewVersion, setCreateNewVersion] = useState(true)
  const [saving, setSaving] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  useEffect(
    function () {
      setIsFinal(version?.is_final ?? false)
    },
    [version],
  )

  function handleChangeFinal() {
    setIsFinal(function (prev) {
      return !prev
    })
  }

  function handleChangeCreateNewVersion() {
    setCreateNewVersion(function (prev) {
      return !prev
    })
  }

  function handleSave() {
    setSaving(true)
  }

  async function confirmSave(formData: FormData) {
    const saveData: SaveData = {
      ...Object.fromEntries(formData.entries()),
      amount: new Big(replenishment.amount).toString(),
      comment,
      data,
      replenishment_id: replenishment.id,
    }

    saveData['final'] = isFinal
    saveData['currency_date_range_start'] = currencyDateRange.start
    saveData['currency_date_range_end'] = currencyDateRange.end

    if (saveData.decision_pdf && (saveData.decision_pdf as File).size) {
      saveData['decision_pdf'] = await encodeFileForUpload(
        saveData.decision_pdf as File,
      )
    } else {
      saveData['decision_pdf'] = null
    }

    setSaving(false)

    api('api/replenishment/scales-of-assessment', {
      data: saveData,
      method: 'POST',
    })
      .then(() => {
        refetchReplenishment()
        refetchSoA()
        if (createNewVersion) {
          setCurrentVersion((prevVersion) => (prevVersion ?? 0) + 1)
        }
        enqueueSnackbar('Data saved successfully.', { variant: 'success' })
      })
      .catch((error) => {
        error.json().then((data: Record<string, string>[]) => {
          // Iterate over each error object and format it
          const messages = data
            .map((errorObj, index) => {
              // Extract the field name and the error message
              const fieldErrors = Object.entries(errorObj).map(
                ([field, errors]) => {
                  // Check if errors is an array or object
                  const errorMessage = Array.isArray(errors)
                    ? errors
                        .map((error) =>
                          typeof error === 'object'
                            ? JSON.stringify(error)
                            : error,
                        )
                        .join(' ')
                    : typeof errors === 'object'
                      ? JSON.stringify(errors)
                      : errors

                  return `Row ${index + 1}: field ${field} - ${errorMessage}\n`
                },
              )

              // Join all field errors for this particular row
              return fieldErrors.join('\n')
            })
            .join('\n\n') // Separate different row errors with double newlines

          // Display the notification with the formatted messages
          enqueueSnackbar(messages, {
            style: { whiteSpace: 'pre-line' },
            variant: 'error',
          })
        })
      })
  }

  function cancelSave() {
    setSaving(false)
  }

  const isNewestVersion = version?.version === versions[0]?.version

  const showSave = !version?.is_final && isNewestVersion

  return (
    <div className="flex items-center gap-x-4 print:hidden">
      {saving ? (
        <FormEditDialog
          title="Save changes?"
          onCancel={cancelSave}
          onSubmit={confirmSave}
        >
          <div className="flex justify-between gap-4">
            <p className="w-7/12 text-lg">
              You can specify meeting and decision numbers where this version
              was approved.
            </p>
            <div className="flex w-5/12 flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <label htmlFor="meeting">Meeting</label>
                  <PopoverInput
                    id="meeting"
                    className="!m-0 h-12 !w-16 !py-1"
                    clearBtnClassName="right-1"
                    field="meeting"
                    options={meetingOptions}
                    placeholder="Select meeting"
                    required={isFinal}
                    withClear={true}
                    withInputPlaceholder={false}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="decision">Decision</label>
                  <Input
                    id="decision"
                    className="!m-0 h-12 w-16 !py-1"
                    required={isFinal}
                    type="text"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label htmlFor="decision_pdf">Decision PDF</label>
                <Input
                  id="decision_pdf"
                  className="!ml-0 h-10"
                  required={false}
                  type="file"
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex">
            <div className="flex items-center gap-x-2">
              <Input
                id="createNewVersion"
                className="!ml-0"
                checked={createNewVersion}
                type="checkbox"
                onChange={handleChangeCreateNewVersion}
              />
              <label htmlFor="createNewVersion">Create new version</label>
            </div>
          </div>
        </FormEditDialog>
      ) : null}
      {showSave && ctx.isTreasurer && (
        <>
          <div className="flex items-center gap-x-2">
            <Input
              id="markAsFinal"
              checked={isFinal}
              type="checkbox"
              onChange={handleChangeFinal}
            />
            <label htmlFor="markAsFinal">Mark as final</label>
          </div>
          <SubmitButton onClick={handleSave}>Save changes</SubmitButton>
        </>
      )}
    </div>
  )
}
