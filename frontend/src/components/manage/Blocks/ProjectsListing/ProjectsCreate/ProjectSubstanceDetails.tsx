import { widgets } from './SpecificFieldsHelpers'
import { SubmitButton } from '../HelperComponents'
import { canViewField, getDefaultValues, hasFields } from '../utils'
import {
  OdsOdpFields,
  SpecificFieldsSectionProps,
  ProjectData,
} from '../interfaces'
import { useStore } from '@ors/store'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { groupBy } from 'lodash'

const ProjectSubstanceDetails = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  odsOdpErrors,
}: SpecificFieldsSectionProps & {
  odsOdpErrors: { [key: string]: [] }[]
}) => {
  const sectionIdentifier = 'projectSpecificFields'
  const field = 'ods_odp'
  const odsOdpData = projectData[sectionIdentifier][field] || []

  const groupedFields = groupBy(sectionFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = (groupedFields[field] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )

  const {
    projectFields: allFields,
    viewableFields,
    editableFields,
  } = useStore((state) => state.projectFields)

  const canViewSubstanceSection = hasFields(
    allFields,
    viewableFields,
    'ods_odp',
    true,
    [],
    'table',
  )

  const onAddSubstance = () => {
    const initialOdsOdp = getDefaultValues<OdsOdpFields>(odsOdpFields)

    setProjectData((prevData) => {
      const sectionData = prevData[sectionIdentifier][field] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: [...sectionData, initialOdsOdp],
        },
      }
    })
  }

  const onRemoveOdsOdp = (index: number) => {
    setProjectData((prevData) => {
      const sectionData = prevData[sectionIdentifier][field] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: sectionData.filter((_, idx) => idx !== index),
        },
      }
    })
  }

  return (
    <div className="flex flex-col gap-y-6">
      {projectFields.map(
        (field) =>
          canViewField(viewableFields, field.write_field_name) &&
          widgets[field.data_type]<ProjectData>(
            projectData,
            setProjectData,
            field,
            errors,
            false,
            hasSubmitted,
            editableFields,
          ),
      )}
      {canViewSubstanceSection && (
        <>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col flex-wrap gap-x-20 gap-y-10">
              {odsOdpData
                .sort(
                  (field1, field2) =>
                    (field1.sort_order ?? 0) - (field2.sort_order ?? 0),
                )
                .map((_, index) => (
                  <>
                    <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-4">
                      {odsOdpFields.map(
                        (odsOdpField) =>
                          canViewField(
                            viewableFields,
                            odsOdpField.write_field_name,
                          ) &&
                          widgets[odsOdpField.data_type]<ProjectData>(
                            projectData,
                            setProjectData,
                            odsOdpField,
                            odsOdpErrors,
                            false,
                            hasSubmitted,
                            editableFields,
                            sectionIdentifier,
                            field,
                            index,
                          ),
                      )}
                      <IoTrash
                        className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                        size={16}
                        onClick={() => {
                          onRemoveOdsOdp(index)
                        }}
                      />
                    </div>
                    {index !== odsOdpData.length - 1 && <Divider />}
                  </>
                ))}
            </div>
          </div>
          {odsOdpFields.length > 0 && (
            <SubmitButton
              title="Add substance"
              onSubmit={onAddSubstance}
              className="mr-auto h-8"
            />
          )}
        </>
      )}
    </div>
  )
}

export default ProjectSubstanceDetails
