import React, { useContext, useEffect, useRef } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { widgets } from './SpecificFieldsHelpers'
import { SubmitButton } from '../HelperComponents'
import {
  canViewField,
  formatOptions,
  getDefaultValues,
  getFieldData,
  getOdsOdpFields,
  hasFields,
  isOtherOdsReplacement,
} from '../utils'
import {
  OdsOdpFields,
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectSpecificFields,
} from '../interfaces'
import { useStore } from '@ors/store'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { find, groupBy } from 'lodash'

const ProjectSubstanceDetails = ({
  projectData,
  setProjectData,
  sectionFields,
  overviewFields,
  errors = {},
  odsOdpErrors,
  disableV3Edit,
}: SpecificFieldsSectionProps & {
  overviewFields: ProjectSpecificFields[]
  odsOdpErrors: { [key: string]: [] }[]
  disableV3Edit: boolean
}) => {
  const { altTechs } = useContext(ProjectsDataContext)

  const sectionIdentifier = 'projectSpecificFields'
  const field = 'ods_odp'
  const crtSectionData = projectData[sectionIdentifier] || []
  const odsOdpData = projectData[sectionIdentifier][field] || []

  const groupedFields = groupBy(sectionFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = getOdsOdpFields(sectionFields)
  const odsDisplayField = getFieldData(odsOdpFields, 'ods_display_name')
  const groupField = getFieldData(overviewFields, 'group')

  const hasPhaseOut = useRef(false)

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
    }, 'substances')
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
    }, 'substances')
  }

  useEffect(() => {
    if (odsDisplayField && groupField) {
      const substancesOptions = formatOptions(odsDisplayField, crtSectionData)
      const validData = odsOdpData.find((data) =>
        find(
          substancesOptions,
          (option) => option.id === data.ods_display_name,
        ),
      )

      if (!validData) {
        setProjectData((prevData) => {
          return {
            ...prevData,
            [sectionIdentifier]: {
              ...prevData[sectionIdentifier],
              [field]: odsOdpData.map((data) => ({
                ...data,
                ods_display_name: null,
              })),
            },
          }
        })
      }
    }
  }, [crtSectionData.group])

  useEffect(() => {
    const isPhaseOut = odsOdpFields.length > 0 && !odsDisplayField

    if (!hasPhaseOut.current && isPhaseOut && odsOdpData.length === 0) {
      onAddSubstance()
      hasPhaseOut.current = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-y-6">
      {projectFields.map(
        (field) =>
          canViewField(viewableFields, field.write_field_name) && (
            <span key={field.write_field_name}>
              {widgets[field.data_type]<ProjectData>(
                projectData,
                setProjectData,
                field,
                errors,
                editableFields,
              )}
            </span>
          ),
      )}
      {canViewSubstanceSection && (
        <>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col flex-wrap gap-x-20">
              {odsOdpFields.length > 0 &&
                odsOdpData
                  .sort(
                    (field1, field2) =>
                      (field1.sort_order ?? 0) - (field2.sort_order ?? 0),
                  )
                  .map((entry, index) => (
                    <span key={index}>
                      <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                        {odsOdpFields.map((odsOdpField) => {
                          const fieldName = odsOdpField.write_field_name
                          const ODS_REPLACEMENT_TEXT = 'ods_replacement_text'
                          const ODS_REPLACEMENT = 'ods_replacement'

                          const isOdsReplacement =
                            fieldName === ODS_REPLACEMENT_TEXT

                          const formattedField = isOdsReplacement
                            ? ({
                                ...odsOdpField,
                                read_field_name: ODS_REPLACEMENT,
                                write_field_name: ODS_REPLACEMENT,
                              } as ProjectSpecificFields)
                            : odsOdpField
                          const customField = isOdsReplacement
                            ? ({
                                ...odsOdpField,
                                read_field_name: ODS_REPLACEMENT_TEXT,
                                write_field_name: ODS_REPLACEMENT_TEXT,
                                data_type: 'text',
                              } as ProjectSpecificFields)
                            : null

                          const shouldDisplayCustomField =
                            !!customField &&
                            isOtherOdsReplacement(
                              altTechs,
                              entry[ODS_REPLACEMENT],
                            )

                          const renderWidget = (
                            fieldConfig: typeof odsOdpField,
                          ) => (
                            <span>
                              {widgets[fieldConfig.data_type]<ProjectData>(
                                projectData,
                                setProjectData,
                                fieldConfig,
                                odsOdpErrors,
                                editableFields,
                                sectionIdentifier,
                                field,
                                index,
                                !!groupField,
                              )}
                            </span>
                          )

                          return (
                            canViewField(viewableFields, fieldName) && (
                              <React.Fragment key={fieldName}>
                                {renderWidget(formattedField)}
                                {shouldDisplayCustomField &&
                                  renderWidget(customField)}
                              </React.Fragment>
                            )
                          )
                        })}
                        {odsDisplayField && !disableV3Edit && (
                          <IoTrash
                            className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                            size={16}
                            onClick={() => {
                              onRemoveOdsOdp(index)
                            }}
                          />
                        )}
                      </div>
                      {index !== odsOdpData.length - 1 && (
                        <Divider className="my-5" />
                      )}
                    </span>
                  ))}
            </div>
          </div>
          {odsOdpFields.length > 0 && odsDisplayField && !disableV3Edit && (
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
