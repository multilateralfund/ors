import { widgets } from './SpecificFieldsHelpers'
import { SubmitButton } from '../HelperComponents'
import { getDefaultValues } from '../utils'
import {
  OdsOdpFields,
  SpecificFieldsSectionProps,
  ProjectData,
} from '../interfaces'

import { IoTrash } from 'react-icons/io5'
import { groupBy } from 'lodash'

const ProjectSubstanceDetails = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  odsOdpErrors,
}: SpecificFieldsSectionProps & {
  odsOdpErrors: { [key: string]: [] | number }[]
}) => {
  const sectionIdentifier = 'projectSpecificFields'
  const field = 'ods_odp'
  const odsOdpData = projectData[sectionIdentifier][field] || []

  const groupedFields = groupBy(sectionFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields[field] || []

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

  const substanceFieldName = 'ods_substance_id'

  const substanceErrors = odsOdpData?.map((odsOdp) => {
    const hasSubstanceId = odsOdp?.[substanceFieldName]
    const substanceField = odsOdpFields.find(
      ({ write_field_name }) => write_field_name === substanceFieldName,
    )
    const substanceLabel =
      substanceField?.label ?? 'Substance - baseline technology'

    return {
      [substanceLabel as string]: !hasSubstanceId
        ? [`${substanceLabel} is required.`]
        : [],
    }
  })

  return (
    <div className="flex flex-col gap-y-6">
      {projectFields.map((field) =>
        widgets[field.data_type]<ProjectData>(
          projectData,
          setProjectData,
          field,
          errors,
          hasSubmitted,
        ),
      )}
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-7">
          {odsOdpData.map((_, index) => (
            <div className="align-center flex flex-row flex-wrap gap-12">
              {odsOdpFields.map((odsOdpField) =>
                widgets[odsOdpField.data_type]<ProjectData>(
                  projectData,
                  setProjectData,
                  odsOdpField,
                  substanceErrors,
                  hasSubmitted,
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
          ))}
        </div>
      </div>
      <SubmitButton
        title="Add substance"
        onSubmit={onAddSubstance}
        className="mr-auto"
      />
    </div>
  )
}

export default ProjectSubstanceDetails
