import React, { useContext, useState } from 'react'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

export default function DisputedContributionDialog() {
  const ctx = useContext(ReplenishmentContext)
  const [showAdd, setShowAdd] = useState(false)

  function showAddDisputedContribution() {
    setShowAdd(true)
  }

  function confirmSave(formData) {
    console.log(formData)
    setShowAdd(false)
    alert(`Save not implemented!\n\n${JSON.stringify(formData, undefined, 2)}`)
  }

  return (
    <div className="print:hidden">
      {showAdd && (
        <FormDialog
          title="Disputed Contribution:"
          onCancel={() => setShowAdd(false)}
          onSubmit={confirmSave}
        >
          <FieldSelect id="iso3" label="Country" required>
            <option value=""> -</option>
            {ctx.countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name_alt}
              </option>
            ))}
          </FieldSelect>
          <FieldInput
            id="disputed_amount"
            label="Disputed amount"
            type="number"
            required
          />
          <FieldInput id="comment" label="Comment" type="text" required />
        </FormDialog>
      )}
      <div>
        <AddButton onClick={showAddDisputedContribution}>
          Add disputed contribution
        </AddButton>
      </div>
    </div>
  )
}