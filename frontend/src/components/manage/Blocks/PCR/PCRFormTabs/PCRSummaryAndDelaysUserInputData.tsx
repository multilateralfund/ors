import {
  PCRData,
  PCRSectionsProps,
  PCRSummaryAndDelays,
  AlternativeTechnology,
  OdsEquipmentFate,
  Enterprises,
} from '../interfaces'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import { map, sortBy } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { useContext } from 'react'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  disposalTypeOpts,
  initialAlternativeTechnology,
  initialEnterprises,
  initialOdsEquipmentFate,
} from '../constants'

const PCRSummaryAndDelaysUserInputData = ({
  PCRData,
  setPCRData,
  errors,
  crtAgencyData = [],
  crtAgency,
}: PCRSectionsProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'summary_and_delays'
  const alternativeTechnologyField = 'alternative_technology'
  const enterprisesField = 'enterprises'
  const odsEquipmentFateField = 'ods_equipment_fate'

  const alternativeTechnologyData =
    crtAgencyData[alternativeTechnologyField] || []
  const enterprisesData = crtAgencyData[enterprisesField] || []
  const odsEquipmentFateData = crtAgencyData[odsEquipmentFateField] || []

  const { substances, blends } = useContext(ProjectsDataContext)

  const substancesOptions = map(sortBy(substances, 'name'), (substance) => ({
    ...substance,
    id: 'substance_' + substance.id,
    name: substance.name,
    is_substance: true,
  }))
  const blendOptions = map(sortBy(blends, 'name'), (blend) => ({
    ...blend,
    id: 'blend_' + blend.id,
    name: blend.name + ' (' + blend.composition + ')',
    is_substance: false,
  }))
  const substanceFieldOpts = [...substancesOptions, ...blendOptions]

  const onAddField = (index: number, field: string, initialData: any) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index
            ? {
                ...agency,
                [field]: [...agency[field], initialData],
              }
            : agency,
        ),
      }
    }, field)
  }

  const onRemoveField = (index: number, index2: number, field: string) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index2
            ? {
                ...agency,
                [field]: agency[field].filter((_, index3) => index3 !== index),
              }
            : agency,
        ),
      }
    }, field)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          {widgets['number']<PCRData, PCRSummaryAndDelays>(
            PCRData,
            setPCRData,
            sectionIdentifier,
            'funds_disbursed',
            errors,
            true,
            [crtAgency],
          )}
          {widgets['date']<PCRData, PCRSummaryAndDelays>(
            PCRData,
            setPCRData,
            sectionIdentifier,
            'date_completion_planned',
            errors,
            [crtAgency],
          )}
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-col flex-wrap gap-x-20">
          {map(alternativeTechnologyData, (_, index) => (
            <span key={index}>
              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                {widgets['drop_down']<PCRData, AlternativeTechnology>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'substance_converted_from',
                  substanceFieldOpts,
                  errors,
                  [crtAgency, index],
                  ['', alternativeTechnologyField],
                )}
                {widgets['drop_down']<PCRData, AlternativeTechnology>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'substance_converted_to',
                  substanceFieldOpts,
                  errors,
                  [crtAgency, index],
                  ['', alternativeTechnologyField],
                )}

                <IoTrash
                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveField(index, crtAgency, alternativeTechnologyField)
                  }}
                />
              </div>
              {index !== alternativeTechnologyData.length - 1 && (
                <Divider className="my-5" />
              )}
            </span>
          ))}
        </div>
      </div>
      <SubmitButton
        title="Add alternative technology"
        onSubmit={() =>
          onAddField(
            crtAgency,
            alternativeTechnologyField,
            initialAlternativeTechnology,
          )
        }
        className="mr-auto h-8"
      />
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-col flex-wrap gap-x-20">
          {map(enterprisesData, (_, index) => (
            <span key={index}>
              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                {widgets['number']<PCRData, Enterprises>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'number_enterprises',
                  errors,
                  false,
                  [crtAgency, index],
                  ['', enterprisesField],
                )}
                {widgets['text_area']<PCRData, Enterprises>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'enterprises_address',
                  errors,
                  [crtAgency, index],
                  ['', enterprisesField],
                )}
                {widgets['number']<PCRData, Enterprises>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'total_number_trainees',
                  errors,
                  false,
                  [crtAgency, index],
                  ['', enterprisesField],
                )}

                <IoTrash
                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveField(index, crtAgency, enterprisesField)
                  }}
                />
              </div>
              {index !== enterprisesData.length - 1 && (
                <Divider className="my-5" />
              )}
            </span>
          ))}
        </div>
      </div>
      <SubmitButton
        title="Add enterprise"
        onSubmit={() =>
          onAddField(crtAgency, enterprisesField, initialEnterprises)
        }
        className="mr-auto h-8"
      />
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-col flex-wrap gap-x-20">
          {map(odsEquipmentFateData, (_, index) => (
            <span key={index}>
              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                {widgets['text_area']<PCRData, OdsEquipmentFate>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'equipment_name',
                  errors,
                  [crtAgency, index],
                  ['', odsEquipmentFateField],
                )}
                {widgets['text_area']<PCRData, OdsEquipmentFate>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'description',
                  errors,
                  [crtAgency, index],
                  ['', odsEquipmentFateField],
                )}
                {widgets['drop_down']<PCRData, OdsEquipmentFate>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'disposal_type',
                  disposalTypeOpts,
                  errors,
                  [crtAgency, index],
                  ['', odsEquipmentFateField],
                )}
                {widgets['date']<PCRData, OdsEquipmentFate>(
                  PCRData,
                  setPCRData,
                  sectionIdentifier,
                  'date_of_disposal',
                  errors,
                  [crtAgency, index],
                  ['', odsEquipmentFateField],
                )}
                <IoTrash
                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveField(index, crtAgency, odsEquipmentFateField)
                  }}
                />
              </div>
              {index !== odsEquipmentFateData.length - 1 && (
                <Divider className="my-5" />
              )}
            </span>
          ))}
        </div>
      </div>
      <SubmitButton
        title="Add ods equipment fate field"
        onSubmit={() =>
          onAddField(crtAgency, odsEquipmentFateField, initialOdsEquipmentFate)
        }
        className="mr-auto h-8"
      />
    </>
  )
}

export default PCRSummaryAndDelaysUserInputData
