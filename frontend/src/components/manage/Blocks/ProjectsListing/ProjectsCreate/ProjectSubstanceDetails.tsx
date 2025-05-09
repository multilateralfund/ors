import { ChangeEvent } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { SpecificFields } from './ProjectsCreate'
import { tableColumns, textAreaClassname } from '../constants'

import { TextareaAutosize } from '@mui/material'

const ProjectSubstanceDetails = ({
  projectSpecificFields,
  setProjectSpecificFields,
}: {
  projectSpecificFields: SpecificFields
  setProjectSpecificFields: React.Dispatch<React.SetStateAction<SpecificFields>>
}) => {
  const handleChangeProductsManufactured = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      products_manufactured: event.target.value,
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <Label>{tableColumns.products_manufactured}</Label>
        <TextareaAutosize
          value={projectSpecificFields?.products_manufactured}
          onChange={handleChangeProductsManufactured}
          className={textAreaClassname + ' !min-h-[20px] !w-[415px]'}
          minRows={2}
          tabIndex={-1}
        />
      </div>
    </div>
  )
}

export default ProjectSubstanceDetails
