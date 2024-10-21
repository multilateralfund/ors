import React, { useState } from 'react'

import { Alert } from '@mui/material'
import { omitBy } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'
import {
  FieldFormattedNumberInput,
  FieldInput,
  FieldPopoverInput,
  FieldSearchableSelect,
  FieldTextInput,
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

  const defaultFields = {
    amount: '0',
    potential_amount: '0',
  }

  const [fields, setFields] = useState<Fields>(defaultFields)
  const [warning, setWarning] = useState<null | string>(null)

  const handleChangeWarning = (amount: string, potential_amount: string) => {
    setWarning(
      getFloat(amount) > getFloat(potential_amount)
        ? 'Amount is greater than potential bilateral assistance'
        : null,
    )
  }

  function showAddBilateralAssistance() {
    setFields(defaultFields)
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

      enqueueSnackbar('Bilateral assistance added successfully.', {
        variant: 'success',
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
        <FormEditDialog
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
          <FieldPopoverInput
            id="meeting_id"
            field="meeting_id"
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
            required={true}
            withClear={true}
          />
          <FieldTextInput
            id="decision_number"
            label="Decision number"
            type="text"
          />
          <FieldInput
            id="comment"
            className="h-[100px] w-[250px]"
            label="Comment"
            type="text-area"
          />
          {warning && (
            <Alert
              className="mt-4 bg-mlfs-bannerColor"
              icon={<IoInformationCircleOutline size={24} />}
              severity="info"
            >
              {warning}
            </Alert>
          )}
        </FormEditDialog>
      )}
      <div>
        <AddButton onClick={showAddBilateralAssistance}>
          Add bilateral assistance
        </AddButton>
      </div>
    </div>
  )
}
