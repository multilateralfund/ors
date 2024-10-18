import React, { useState } from 'react'

import { omitBy } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSearchableSelect,
  FieldTextInput,
  FieldWrappedNumberInput,
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

    const cleanData = omitBy(data, (value) => value === '')

    const formattedData = {
      ...cleanData,
      ...(cleanData.meeting_id && {
        meeting_id: parseInt(cleanData.meeting_id.toString()),
      }),
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
          <FieldSearchableSelect id="country" label="Country" required>
            {countryOptions.map((c) => (
              <option key={c.country_id} value={c.country_id}>
                {c.country}
              </option>
            ))}
          </FieldSearchableSelect>
          <FieldWrappedNumberInput
            id="amount"
            label="Disputed amount"
            required
          />
          <FieldInput id="comment" label="Comment" type="text-area" required />
          <FieldWrappedNumberInput
            id="year"
            label="Year"
            value={year}
            readOnly
          />
          <FieldSearchableSelect
            id="meeting_id"
            hideFirstOption={true}
            label="Meeting"
          >
            <option value="" disabled hidden />
            {meetingOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </FieldSearchableSelect>
          <FieldTextInput
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
