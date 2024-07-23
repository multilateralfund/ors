import React, { useEffect, useState } from 'react'

import cx from 'classnames'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { AddButton } from '@ors/components/ui/Button/Button'
import { formatApiUrl } from '@ors/helpers'

import { IoDocumentTextOutline, IoTrash } from 'react-icons/io5'


function InvoiceAttachments(props) {
  const { withFileType = true } = props
  const [files, setFiles] = useState([])
  const [oldFiles, setOldFiles] = useState(props.oldFiles || [])
  const [deletedFiles, setDeletedFiles] = useState([])

  useEffect(() => {
    if (props.oldFiles) {
      setOldFiles(props.oldFiles)
    }
  }, [props.oldFiles])

  function handleNewFileField() {
    setFiles((prev) => {
      const newId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1
      return [...prev, { id: newId }]
    })
  }

  function handleDeleteFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDeleteOldFiles(index) {
    // this files will have an id
    // we need to add that id to a list of files to be deleted to be sent to the backend
    setOldFiles((prev) => prev.filter((_, i) => i !== index))
    setDeletedFiles((prev) => [...prev, oldFiles[index].id])
  }

  console.log(deletedFiles)

  return (
    <div className="flex flex-col gap-3">
      {oldFiles && oldFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {oldFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 bg-transparent"
            >
              <div className="flex items-center gap-2">
                <IoDocumentTextOutline color="#0086C9" size="16" />
                <a
                  className="text-secondary no-underline"
                  href={formatApiUrl(file.download_url)}
                >
                  {file.filename}
                </a>
              </div>
              <IoTrash
                className="cursor-pointer  text-red-500"
                size={20}
                onClick={() => handleDeleteOldFiles(index)}
              />
            </div>
          ))}
        </div>
      )}
      <div className="font-sm flex justify-between">
        <AddButton
          className="p-[0px] text-sm"
          iconSize={14}
          type="button"
          onClick={handleNewFileField}
        >
          {files.length > 0 ? 'Add another file' : 'Add file'}
        </AddButton>
      </div>
      <div>
        {files.map((o, i) => {
          return (
            <div
              key={o.id}
              className={cx('flex items-center justify-between gap-3')}
            >
              {withFileType && (
                <Select id={`file_type_${i}`} className="h-10 !ml-0">
                  <option value="invoice">Invoice</option>
                  <option value="reminder">Reminder</option>
                </Select>
              )}
              <Input id={`file_${i}`} className="h-10 !ml-0" type="file" required />
              <IoTrash
                className="cursor-pointer text-red-500"
                size={20}
                onClick={() => handleDeleteFile(i)}
              />
            </div>
          )
        })}
      </div>
      <input
        id="deleted_files"
        name="deleted_files"
        type="hidden"
        value={JSON.stringify(deletedFiles)}
      />
    </div>
  )
}

export default InvoiceAttachments
