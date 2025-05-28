import { useState } from 'react'

import ProjectOdsOdpTable from '../ProjectView/ProjectOdsOdpTable'
import OdsOdpModal from './OdsOdpModal'
import { widgets } from './SpecificFieldsHelpers'
import {
  OdsOdpFields,
  SpecificFieldsSectionProps,
  ProjectData,
} from '../interfaces'

import { ICellRendererParams } from 'ag-grid-community'
import { Button } from '@mui/material'
import { IoAddCircle } from 'react-icons/io5'
import { findIndex, groupBy, map } from 'lodash'

const ProjectSubstanceDetails = ({
  projectData,
  setProjectData,
  sectionFields,
  errors,
  projectId,
}: SpecificFieldsSectionProps) => {
  const [displayModal, setDisplayModal] = useState(false)

  const sectionIdentifier = 'projectSpecificFields'
  const field = 'ods_odp'
  const odsOdpData = projectData[sectionIdentifier][field]

  const groupedFields = groupBy(sectionFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields[field] || []

  const onRemoveOdsOdp = (props: ICellRendererParams) => {
    const odsOdpDataCopy = [...odsOdpData]

    const index = findIndex(
      odsOdpDataCopy,
      (row: OdsOdpFields & { id?: number }) => row.id === props.data.id,
    )

    if (index > -1) {
      odsOdpDataCopy.splice(index, 1)

      const formattedData = map(odsOdpDataCopy, (dataItem, index) => ({
        ...dataItem,
        id: odsOdpDataCopy.length - index - 1,
      }))

      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: formattedData,
        },
      }))
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      {projectFields.map((field) =>
        widgets[field.data_type]<ProjectData>(
          projectData,
          setProjectData,
          field,
          errors as { [key: string]: string[] },
          projectId,
        ),
      )}
      {odsOdpFields.length > 0 && (
        <div>
          <ProjectOdsOdpTable
            data={odsOdpData || []}
            fields={odsOdpFields}
            mode="edit"
            {...{
              onRemoveOdsOdp,
              setProjectData,
              sectionIdentifier,
              field,
              errors,
              projectId,
            }}
          />
          <Button
            className="rounded-lg border border-solid border-primary bg-white p-1.5 text-base hover:bg-primary"
            onClick={() => setDisplayModal(true)}
          >
            Add row
            <IoAddCircle className="ml-1.5" size={18} />
          </Button>
        </div>
      )}

      {displayModal && (
        <OdsOdpModal
          {...{
            displayModal,
            setDisplayModal,
            setProjectData,
            odsOdpFields,
            field,
          }}
        />
      )}
    </div>
  )
}

export default ProjectSubstanceDetails
