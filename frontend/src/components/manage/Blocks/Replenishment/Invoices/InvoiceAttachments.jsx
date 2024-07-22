import React, { useState } from 'react'

import cx from 'classnames'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton, DeleteButton } from '@ors/components/ui/Button/Button'

function InvoiceAttachments() {
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState([])

  function handleNewFileField() {
    setFiles((prev) => {
      const newId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1
      return [...prev, { id: newId }]
    })
  }

  function handleDeleteSelectedFileFields() {
    setFiles((prev) => {
      const result = []
      for (let i = 0; i < prev.length; i++) {
        if (!selected.includes(i)) {
          result.push(prev[i])
        }
      }
      return result
    })
    setSelected([])
  }

  function handleToggleSelected(idx) {
    function toggle() {
      setSelected((prev) => {
        const result = []
        let removed = false
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== idx) {
            result.push(prev[i])
          } else {
            removed = true
          }
        }

        if (!removed) {
          result.push(idx)
        }

        return result
      })
    }
    return toggle
  }

  return (
    <div>
      <div className="font-sm flex justify-between">
        <AddButton
          className="p-[0px] text-sm"
          iconSize={14}
          type="button"
          onClick={handleNewFileField}
        >
          {files ? 'Add another file' : 'Add file'}
        </AddButton>
        {selected.length ? (
          <DeleteButton
            className="py-1 text-sm"
            type="button"
            onClick={handleDeleteSelectedFileFields}
          >
            Remove selected
          </DeleteButton>
        ) : null}
      </div>
      <div className="">
        {files.map((o, i) => {
          return (
            <div
              key={o.id}
              className={cx('flex justify-between py-2 [&_select]:ml-0')}
            >
              <Select id={`file_type_${i}`}>
                <option value="invoice">Invoice</option>
                <option value="reminder">Reminder</option>
              </Select>
              <Input id={`file_${i}`} type="file" required />
              <Input
                id={`file_chk_${i}`}
                checked={selected.includes(i)}
                type="checkbox"
                onClick={handleToggleSelected(i)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InvoiceAttachments
