import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRTextAreaWidget, PCRTextWidget } from './PCRWidgets'
import { AddEntityButton } from './EditHelperComponents'
import {
  SubSectionTitle,
  UserInfo,
  NrEntity,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { prField, borderedContainerClassname } from '../constants'
import { getErrorIndex } from '../utils'

import { MdOutlineLightbulb } from 'react-icons/md'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { filter, map } from 'lodash'
import cx from 'classnames'

const PCRProjectRecommendations = ({
  crtTab,
  errors,
}: {
  crtTab: number
  errors: Record<string, any>[]
}) => {
  const sectionIdentifier = 'future_project_recommendations'

  const { PCRData, setPCRData, setErrors } = useContext(PCRDataContext)

  const sectionData = PCRData[sectionIdentifier] || []
  const prData = sectionData[crtTab][prField] || []
  const crtAgencyId = sectionData[crtTab].agency_id

  const onAddRecommendation = () => {
    const initialRecommendationsData = { title: '', description: '' }

    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [prField]: [...data[prField], initialRecommendationsData],
              }
            : data,
        ),
      }
    }, prField)

    const errorIndex = getErrorIndex(
      sectionData,
      prField,
      crtAgencyId,
      prData.length,
    )

    setErrors((prevData: Record<string, any[]>) => {
      const prErrors = prevData[sectionIdentifier] ?? []

      return {
        ...prevData,
        [sectionIdentifier]: [
          ...prErrors.slice(0, errorIndex),
          {},
          ...prErrors.slice(errorIndex),
        ],
      }
    })
  }

  const onRemoveRecommendation = (prIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [prField]: data[prField].filter(
                  (_, crtPrIndex) => crtPrIndex !== prIndex,
                ),
              }
            : data,
        ),
      }
    }, prField)

    const errorIndex = getErrorIndex(sectionData, prField, crtAgencyId, prIndex)

    setErrors((prevData: Record<string, any[]>) => ({
      ...prevData,
      [sectionIdentifier]: filter(
        prevData[sectionIdentifier],
        (_, index) => index !== errorIndex,
      ),
    }))
  }

  return (
    <div className={cx('bg-white px-6 py-4', borderedContainerClassname)}>
      <div className="mb-5 flex items-center gap-2">
        <MdOutlineLightbulb size={22} className="mb-1" />
        <SubSectionTitle>Recommendations for future projects</SubSectionTitle>
        <UserInfo info="As part of the lessons learned from the challenges/good practices identified during project implementation, please suggest recommendations for future project design and implementation." />
      </div>
      {map(prData, (_, prIndex) => (
        <div key={prIndex}>
          <div className="flex gap-3">
            {NrEntity(prIndex)}
            <div className="flex w-[65%] flex-col gap-3">
              <PCRTextWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="title"
                className="w-full md:!min-w-[calc(100%-28px)]"
                errors={errors}
                indexes={[crtTab, prIndex]}
                subFields={['', prField]}
                excludeLabel={true}
              />
              <PCRTextAreaWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="description"
                errors={errors}
                indexes={[crtTab, prIndex]}
                subFields={['', prField]}
                rows={2}
                excludeLabel={true}
                className="md:!min-w-[calc(100%-28px)]"
              />
            </div>
            <IoTrash
              className="mt-1.5 min-h-6 min-w-6 cursor-pointer fill-[#8a2323]"
              size={16}
              onClick={() => {
                onRemoveRecommendation(prIndex)
              }}
            />
          </div>
          {prIndex !== prData.length - 1 && <Divider className="my-4" />}
        </div>
      ))}
      <AddEntityButton
        title="Add recommendation"
        action={onAddRecommendation}
        nrEntities={prData.length}
      />
    </div>
  )
}

export default PCRProjectRecommendations
