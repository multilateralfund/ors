import React, { useState } from 'react'

import { enqueueSnackbar } from 'notistack'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldNumberInput,
  FieldSelect,
  SearchableSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import { api } from '@ors/helpers'

import { DisputedContributionDialogProps } from './types'

export default function DisputedContributionDialog(
  props: DisputedContributionDialogProps,
) {
  const { countryOptions, meetingOptions, refetchSCData, year } = props
  const [showAdd, setShowAdd] = useState(false)

  function showAddDisputedContribution() {
    setShowAdd(true)
  }

  async function confirmSave(formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const formattedData = {
      ...data,
      meeting_id: parseInt(data.meeting_id.toString()),
    }

    try {
      await api('/api/replenishment/disputed-contributions/', {
        data: formattedData,
        method: 'POST',
      })
      setShowAdd(false)
      refetchSCData()
    } catch (error) {
      error.json().then((data: Record<string, string[]>) => {
        enqueueSnackbar(
          Object.entries(data)
            .map(([_, value]) =>
              typeof value === 'object' ? JSON.stringify(value) : value,
            )
            .join(' '),
          { variant: 'error' },
        )
      })
    }
  }

  return (
    <>
      {showAdd && (
        <FormDialog
          title="Disputed Contribution:"
          onCancel={() => setShowAdd(false)}
          onSubmit={confirmSave}
        >
          <FieldSelect id="country" label="Country" required>
            <option value=""> -</option>
            {countryOptions.map((c) => (
              <option key={c.country_id} value={c.country_id}>
                {c.country}
              </option>
            ))}
          </FieldSelect>
          <FieldNumberInput id="amount" label="Disputed amount" required />
          <FieldInput id="comment" label="Comment" type="text-area" required />
          <FieldNumberInput id="year" label="Year" value={year} readOnly />
          <div className="mt-4 flex items-center justify-start">
            <label className="grow-1" htmlFor="meeting_id">
              Approved by ExCom as of
            </label>
            <SearchableSelect id="meeting_id" required>
              {meetingOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </SearchableSelect>
            <label className="ml-1.5" htmlFor="meeting_id">
              meeting.
            </label>
          </div>
          <FieldInput
            id="decision_number"
            label="Decision number"
            type="text"
          />
        </FormDialog>
      )}
      <div>
        <AddButton onClick={showAddDisputedContribution}>
          Add disputed contribution
        </AddButton>
      </div>
    </>
  )
}
