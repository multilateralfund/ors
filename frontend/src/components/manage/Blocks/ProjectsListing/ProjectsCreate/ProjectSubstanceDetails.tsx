import { useState, ChangeEvent } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import OdsOdpModal from './OdsOdpModal'
import ProjectOdsOdpTable from '../ProjectView/ProjectOdsOdpTable'
import { tableColumns, textAreaClassname } from '../constants'
import { SpecificFieldsSectionProps } from '../interfaces'

import { TextareaAutosize, Button } from '@mui/material'
import { IoAddCircle } from 'react-icons/io5'
import { findIndex, map } from 'lodash'

const ProjectSubstanceDetails = ({
  projectSpecificFields,
  setProjectSpecificFields,
}: SpecificFieldsSectionProps) => {
  const [displayODPModal, setDisplayODPModal] = useState(false)

  const handleChangeProductsManufactured = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      products_manufactured: event.target.value,
    }))
  }

  const onRemoveOdsOdp = (props: any) => {
    const removedOdsOdp = props.data
    const newData = [...projectSpecificFields.ods_odp]

    const index = findIndex(newData, (row: any) => row.id === removedOdsOdp.id)

    if (index > -1) {
      newData.splice(index, 1)

      const formattedData = map(newData, (dataItem, index) => ({
        ...dataItem,
        id: newData.length - index - 1,
      }))

      setProjectSpecificFields((prevFilters: any) => ({
        ...prevFilters,
        ods_odp: formattedData,
      }))
    }
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
      <div>
        <ProjectOdsOdpTable
          data={projectSpecificFields?.ods_odp || []}
          mode="edit"
          onRemoveOdsOdp={onRemoveOdsOdp}
        />
        <Button
          className="rounded-lg border border-solid border-primary bg-white p-1.5 text-base hover:bg-primary"
          onClick={() => setDisplayODPModal(true)}
        >
          Add {tableColumns.ods_odp}
          <IoAddCircle className="ml-1.5" size={18} />
        </Button>
      </div>
      {displayODPModal && (
        <OdsOdpModal
          {...{
            displayODPModal,
            setDisplayODPModal,
            setProjectSpecificFields,
          }}
        />
      )}
    </div>
  )
}

export default ProjectSubstanceDetails
