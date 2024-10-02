import React, { useState } from 'react'

import { enqueueSnackbar } from 'notistack'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import { api } from '@ors/helpers'

import { DisputedContributionDialogProps } from './types'

export default function DisputedContributionDialog(
  props: DisputedContributionDialogProps,
) {
  const { countryOptions, refetchSCData, year } = props
  const [showAdd, setShowAdd] = useState(false)

  function showAddDisputedContribution() {
    setShowAdd(true)
  }

  async function confirmSave(formData: FormData) {
    try {
      await api('/api/replenishment/disputed-contributions/', {
        data: Object.fromEntries(formData.entries()),
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
          <FieldInput
            id="amount"
            label="Disputed amount"
            type="number"
            required
          />
          <FieldInput id="comment" label="Comment" type="text-area" required />
          <FieldInput
            id="year"
            label="Year"
            type="number"
            value={year}
            readOnly
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
