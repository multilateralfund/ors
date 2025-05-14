import { useState } from 'react'

import ProjectOdsOdpTable from '../ProjectView/ProjectOdsOdpTable'
import OdsOdpModal from './OdsOdpModal'
import { widgets } from './SpecificFieldsHelpers'
import { OdsOdpFields, SpecificFieldsSectionProps } from '../interfaces'
import { tableColumns } from '../constants'

import { ICellRendererParams } from 'ag-grid-community'
import { Button } from '@mui/material'
import { IoAddCircle } from 'react-icons/io5'
import { filter, findIndex, map } from 'lodash'

const ProjectSubstanceDetails = ({
  projectSpecificFields,
  setProjectSpecificFields,
  fields,
}: SpecificFieldsSectionProps) => {
  const [displayODPModal, setDisplayODPModal] = useState(false)

  const projectFields = filter(fields, (field) => field.table === 'project')
  const odsOdpFields = filter(fields, (field) => field.table === 'ods_odp')

  const onRemoveOdsOdp = (props: ICellRendererParams) => {
    const odsOdpData = [...projectSpecificFields.ods_odp]

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

      setProjectSpecificFields((prevFilters) => ({
        ...prevFilters,
        ods_odp: formattedData,
      }))
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      {projectFields.map((field) =>
        widgets[field.data_type](
          field,
          projectSpecificFields,
          setProjectSpecificFields,
        ),
      )}
      {odsOdpFields.length > 0 && (
        <div>
          <ProjectOdsOdpTable
            odsOdpFields={odsOdpFields}
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
      )}

      {displayODPModal && (
        <OdsOdpModal
          {...{
            displayODPModal,
            setDisplayODPModal,
            setProjectSpecificFields,
            odsOdpFields,
          }}
          field="ods_odp"
        />
      )}
    </div>
  )
}

export default ProjectSubstanceDetails
