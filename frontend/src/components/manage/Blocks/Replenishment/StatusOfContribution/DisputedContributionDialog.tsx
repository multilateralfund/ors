import React, { useState } from 'react'

import { omitBy } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'
import {
  FieldFormattedNumberInput,
  FieldInput,
  FieldPopoverInput,
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

  const defaultFields = {
    amount: '0',
  }

  const [fields, setFields] = useState(defaultFields)
  const [showAdd, setShowAdd] = useState(false)

  function showAddDisputedContribution() {
    setFields(defaultFields)
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
        <FormEditDialog
          style={{ minWidth: '40%' }}
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
          <FieldFormattedNumberInput
            id="amount"
            label="Disputed amount"
            value={fields.amount}
            onChange={(evt) => {
              setFields((prev) => ({ ...prev, amount: evt.target.value }))
            }}
            required
          />
          <FieldInput id="comment" label="Comment" type="text-area" required />
          <FieldWrappedNumberInput
            id="year"
            label="Year"
            value={year}
            readOnly
          />
          <FieldPopoverInput
            id="meeting_id"
            field="meeting_id"
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
            withClear={true}
          />
          <FieldTextInput
            id="decision_number"
            label="Decision number"
            type="text"
          />
        </FormEditDialog>
      )}
      <div>
        <AddButton onClick={showAddDisputedContribution}>
          Add disputed contribution
        </AddButton>
      </div>
    </>
  )
}
