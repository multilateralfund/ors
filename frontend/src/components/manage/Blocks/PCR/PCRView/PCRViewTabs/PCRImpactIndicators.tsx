import { useContext, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRImpactIndicatorInput from '../../PCRSubmission/PCRImpactIndicatorInput'
import {
  NoDataReported,
  getCollapseIcon,
  ImpactIndicatorSourceTag,
} from './ViewHelperComponents'
import { PCRImpactIndicatorType } from '../../interfaces'
import { formatImpactIndicatorValue } from '../../utils'

import { isEmpty, map, some } from 'lodash'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCRImpactIndicators = ({
  isEditable = false,
}: {
  isEditable?: boolean
}) => {
  const { pcr, pcrDefaultData, PCRData, errors } = useContext(PCRDataContext)

  const [isExpanded, setIsExpanded] = useState(false)

  const impactIndicators: PCRImpactIndicatorType[] = isEditable
    ? PCRData.impact_indicators
    : (pcr.data?.impact_indicators ??
      pcrDefaultData.data?.impact_indicators ??
      [])

  const hasErrors =
    isEditable &&
    some(impactIndicators, ({ field }) => !isEmpty(errors.overview?.[field]))

  return (
    <>
      <span
        className="flex w-fit cursor-pointer items-center gap-x-2 text-xl font-bold text-primary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getCollapseIcon(isExpanded)}
        Impact indicators
        {hasErrors && <SectionErrorIndicator errors={[]} />}
      </span>
      {isExpanded && (
        <div className="mt-4">
          {impactIndicators.length > 0 ? (
            <div
              className={cx(
                'grid grid-cols-1 gap-x-8 md:grid-cols-2 min-[1460px]:grid-cols-4 [&_h4]:break-words',
                { 'gap-y-4': isEditable },
              )}
            >
              {map(impactIndicators, (indicator) =>
                isEditable ? (
                  <PCRImpactIndicatorInput
                    key={indicator.field}
                    indicator={indicator}
                  />
                ) : (
                  <div
                    key={indicator.field}
                    className="flex flex-col justify-between gap-1"
                  >
                    <span className="text-[#4D4D4D]">{indicator.label}</span>
                    <div>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h4 className="m-0 text-xl font-semibold text-primary">
                          {formatImpactIndicatorValue(
                            indicator.data_type,
                            indicator.value,
                          ) || '-'}
                        </h4>
                        <ImpactIndicatorSourceTag indicator={indicator} />
                      </span>
                      <Divider className="my-4" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <NoDataReported text="No impact indicators apply to the projects of this PCR." />
          )}
        </div>
      )}
    </>
  )
}

export default PCRImpactIndicators
