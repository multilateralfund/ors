import { useState } from 'react'

import ProjectOdsOdpTable from '../ProjectView/ProjectOdsOdpTable'
import OdsOdpModal from './OdsOdpModal'
import { widgets } from './SpecificFieldsHelpers'
import {
  OdsOdpFields,
  SpecificFieldsSectionProps,
  SpecificFields,
} from '../interfaces'
import { tableColumns } from '../constants'

import { ICellRendererParams } from 'ag-grid-community'
import { Button } from '@mui/material'
import { IoAddCircle } from 'react-icons/io5'
import { findIndex, groupBy, map } from 'lodash'

const ProjectSubstanceDetails = ({
  fields,
  setFields,
  sectionFields,
}: SpecificFieldsSectionProps) => {
  const [displayModal, setDisplayModal] = useState(false)

  const field = 'ods_odp'

  const groupedFields = groupBy(sectionFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields[field] || []

  const onRemoveOdsOdp = (props: ICellRendererParams) => {
    const odsOdpData = [...fields.ods_odp]

    const index = findIndex(
      odsOdpData,
      (row: OdsOdpFields & { id?: number }) => row.id === props.data.id,
    )

    if (index > -1) {
      odsOdpData.splice(index, 1)

      const formattedData = map(odsOdpData, (dataItem, index) => ({
        ...dataItem,
        id: odsOdpData.length - index - 1,
      }))

      setFields((prevFields) => ({ ...prevFields, ods_odp: formattedData }))
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      {projectFields.map((field) =>
        widgets[field.data_type]<SpecificFields>(fields, setFields, field),
      )}
      {odsOdpFields.length > 0 && (
        <div>
          <ProjectOdsOdpTable
            data={fields?.ods_odp || []}
            fields={odsOdpFields}
            mode="edit"
            onRemoveOdsOdp={onRemoveOdsOdp}
          />
          <Button
            className="rounded-lg border border-solid border-primary bg-white p-1.5 text-base hover:bg-primary"
            onClick={() => setDisplayModal(true)}
          >
            Add {tableColumns.ods_odp}
            <IoAddCircle className="ml-1.5" size={18} />
          </Button>
        </div>
      )}

      {displayModal && (
        <OdsOdpModal
          {...{
            displayModal,
            setDisplayModal,
            setFields,
            odsOdpFields,
            field,
          }}
        />
      )}
    </div>
  )
}

export default ProjectSubstanceDetails
