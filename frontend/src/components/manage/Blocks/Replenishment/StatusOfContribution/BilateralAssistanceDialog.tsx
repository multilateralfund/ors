import React, { useState } from 'react'

import { Alert } from '@mui/material'
import { omitBy } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldFormattedNumberInput,
  FieldInput,
  FieldSearchableSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import { api } from '@ors/helpers'
import { getFloat } from '@ors/helpers/Utils/Utils'

import { BilateralAssistanceDialogProps } from './types'

import { IoInformationCircleOutline } from 'react-icons/io5'

type Fields = {
  amount: string
  potential_amount: string
}

export default function BilateralAssistanceDialog(
  props: BilateralAssistanceDialogProps,
) {
  const { countryOptions, meetingOptions, refetchSCData, rows, year } = props
  const [showAdd, setShowAdd] = useState(false)

  const [fields, setFields] = useState<Fields>({
    amount: '0',
    potential_amount: '0',
  })
  const [warning, setWarning] = useState<null | string>(null)

  const handleChangeWarning = (amount: string, potential_amount: string) => {
    setWarning(
      getFloat(amount) > getFloat(potential_amount)
        ? 'Amount is greater than potential bilateral assistance'
        : null,
    )
  }

  function showAddBilateralAssistance() {
    setShowAdd(true)
  }

  async function confirmSave(formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const cleanData = omitBy(data, (value) => value === '')

    const formattedData = {
      ...cleanData,
      meeting_id: parseInt(data.meeting_id.toString()),
      year: year,
    }

    try {
      await api('/api/replenishment/bilateral-assistance/', {
        data: formattedData,
        method: 'POST',
      })
      setFields({ amount: '0', potential_amount: '0' })
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

  function handleSelectCountry(value: string) {
    for (let i = 0; i < rows.length; i++) {
      if (parseInt(value, 10) == rows[i].country_id) {
        const potential_amount = (rows[i].agreed_contributions * 0.2).toString()

        setFields(function (prev) {
          return {
            ...fields,
            potential_amount: potential_amount,
          }
        })
        handleChangeWarning(fields?.amount, potential_amount)

        break
      }
    }
  }

  return (
    <div className="print:hidden">
      {showAdd && (
        <FormDialog
          title={`Bilateral assistance (${year}):`}
          onCancel={() => setShowAdd(false)}
          onSubmit={confirmSave}
        >
          <FieldSearchableSelect
            id="country_id"
            label="Country"
            onChange={handleSelectCountry}
            required
          >
            {countryOptions.map((c) => (
              <option key={c.country_id} value={c.country_id}>
                {c.country}
              </option>
            ))}
          </FieldSearchableSelect>
          <FieldFormattedNumberInput
            id="potential_amount"
            label="Potential bilateral assistance"
            value={fields.potential_amount}
            disabled
            readOnly
          />
          <FieldFormattedNumberInput
            id="amount"
            label="Amount (USD)"
            value={fields.amount}
            onChange={(evt) => {
              setFields((prev) => ({ ...prev, amount: evt.target.value }))
              handleChangeWarning(evt.target.value, fields?.potential_amount)
            }}
            required
          />
          <FieldSearchableSelect id="meeting_id" label="Meeting" required>
            {meetingOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </FieldSearchableSelect>
          <FieldInput
            id="decision_number"
            label="Decision number"
            type="text"
          />
          <FieldInput id="comment" label="Comment" type="text-area" required />
          {warning && (
            <Alert
              className="mt-4 bg-mlfs-bannerColor"
              icon={<IoInformationCircleOutline size={24} />}
              severity="info"
            >
              {warning}
            </Alert>
          )}
        </FormDialog>
      )}
      <div>
        <AddButton onClick={showAddBilateralAssistance}>
          Add bilateral assistance
        </AddButton>
      </div>
    </div>
  )
}
