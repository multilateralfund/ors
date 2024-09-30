import type { ChangeEvent } from 'react'

import React, { useState } from 'react'

import { enqueueSnackbar } from 'notistack'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldFormattedNumberInput,
  FieldSelect,
  Input,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import { api } from '@ors/helpers'
import { getFloat } from '@ors/helpers/Utils/Utils'

import { BilateralAssistanceDialogProps } from './types'

type Fields = {
  amount: string
  potential_amount: string
}

export default function BilateralAssistanceDialog(
  props: BilateralAssistanceDialogProps,
) {
  const { countryOptions, refetchSCData, rows, year } = props
  const [showAdd, setShowAdd] = useState(false)

  const [fields, setFields] = useState<Fields>({
    amount: '0',
    potential_amount: '0',
  })

  function showAddBilateralAssistance() {
    setShowAdd(true)
  }

  async function confirmSave(formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    data.year = year
    try {
      await api('/api/replenishment/bilateral-assistance/', {
        data: data,
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

  function handleSelectCountry(evt: ChangeEvent<HTMLSelectElement>) {
    const selectedCountryId = evt.target.value
    for (let i = 0; i < rows.length; i++) {
      if (parseInt(selectedCountryId, 10) == rows[i].country_id) {
        setFields(function (prev) {
          return {
            ...fields,
            potential_amount: (rows[i].agreed_contributions * 0.2).toString(),
          }
        })
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
          <FieldSelect
            id="country_id"
            label="Country"
            onChange={handleSelectCountry}
            required
          >
            <option value="">-</option>
            {countryOptions.map((c) => (
              <option key={c.country_id} value={c.country_id}>
                {c.country}
              </option>
            ))}
          </FieldSelect>
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
            max={getFloat(fields?.potential_amount) * 0.2}
            value={fields.amount}
            onChange={(evt) =>
              setFields((prev) => ({ ...prev, amount: evt.target.value }))
            }
            required
          />
          <div className="mt-4 flex items-center justify-start">
            <label className="grow-1" htmlFor="approvedExCom">
              Approved by ExCom as of
            </label>
            <Input id="approvedExCom" className="mx-4 max-w-28" type="number" />
            <label htmlFor="approvedExCom">meeting.</label>
          </div>
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
