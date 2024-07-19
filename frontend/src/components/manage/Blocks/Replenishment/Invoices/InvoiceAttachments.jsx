import React, { useState } from 'react'

import cx from 'classnames'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton, DeleteButton } from '@ors/components/ui/Button/Button'

function InvoiceAttachments() {
  const [files, setFiles] = useState([{ id: 1 }])
  const [selected, setSelected] = useState([])

  function handleNewFileField() {
    setFiles((prev) => [...prev, { id: [...prev].pop().id + 1 }])
  }

  function handleDeleteSelectedFileFields() {
    setFiles(function (prev) {
      const result = []
      for (let i = 0; i < files.length; i++) {
        if (!selected.includes(i)) {
          result.push(files[i])
        }
      }
      if (result.length === 0) {
        result.push({ id: 1 })
      }
      return result
    })
    setSelected([])
  }

  function handleToggleSelected(idx) {
    function toggle() {
      setSelected(function (prev) {
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
          Add another
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
              <Input id={`file_${i}`} type="file" />
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
