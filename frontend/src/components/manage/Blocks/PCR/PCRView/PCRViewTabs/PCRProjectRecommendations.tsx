import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SubSectionTitle,
  NrEntity,
  NoDataReported,
  detailItem,
} from './ViewHelperComponents'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  textareaClassname,
  borderedContainerClassname,
} from '../../constants'

import { MdOutlineLightbulb } from 'react-icons/md'
import { filter, keys, map } from 'lodash'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCRProjectRecommendations = ({
  pcr,
  crtTab,
}: {
  pcr: PCRResponse
  crtTab: number
}) => {
  const { fundsByAgency } = useContext(PCRDataContext)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]

  const prData = filter(
    pcr.future_project_recommendations,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )

  return (
    <div className={cx('bg-white px-6 py-4', borderedContainerClassname)}>
      <div className="mb-5 flex items-center gap-2">
        <MdOutlineLightbulb size={22} className="mb-1" />
        <SubSectionTitle>Recommendations for future projects</SubSectionTitle>
      </div>
      {prData.length > 0 ? (
        map(prData, (pr, prIndex) => (
          <div key={prIndex}>
            <div className="flex gap-3">
              {NrEntity(prIndex)}
              <div>
                <h4 className="m-0 text-lg font-semibold text-primary">
                  {pr.title || '-'}
                </h4>
                {detailItem('', pr.description, textareaClassname, false, true)}
              </div>
            </div>
            {prIndex !== prData.length - 1 && <Divider className="my-4" />}
          </div>
        ))
      ) : (
        <NoDataReported text="No data reported." />
      )}
    </div>
  )
}

export default PCRProjectRecommendations
