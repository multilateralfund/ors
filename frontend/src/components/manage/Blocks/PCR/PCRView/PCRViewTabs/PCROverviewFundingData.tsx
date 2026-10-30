import { Fragment, useContext } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { numberDetailItem } from './ViewHelperComponents'
import { PCROverviewProps } from '../../interfaces'
import { getFundingClassname } from '../../utils'
import {
  pcrFieldsMapping,
  viewPcrFieldsMapping,
  fundingFields,
} from '../../constants'

import { find, map } from 'lodash'

const PCROverviewFundingData = ({
  isFundingExpanded,
}: {
  isFundingExpanded: boolean
}) => {
  const { agencyIds, fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )
  const agencyEntries = [...crtAgencies, 'total']

  const formatAgencyFundFields = (
    field: keyof PCROverviewProps,
    agencyId?: number,
  ) => {
    const value = !!agencyId
      ? (fundsByAgency[field] as Record<number, number>)[agencyId]
      : (fundsByAgency[field] as number)

    return (value ? String(value) : null) as string
  }

  return agencyEntries.map((agency, index) => {
    const isTotal = agency === 'total'

    return (
      (isFundingExpanded || isTotal) && (
        <div key={index} className={getFundingClassname(index, isTotal)}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="self-center text-3xl font-medium uppercase text-primary">
              {agency}
            </div>
            {map(fundingFields, (field, fieldIndex) => {
              const formattedField = isTotal ? `total_${field}` : field

              return (
                <Fragment key={fieldIndex}>
                  {numberDetailItem(
                    { ...pcrFieldsMapping, ...viewPcrFieldsMapping }[
                      formattedField
                    ],
                    formatAgencyFundFields(
                      formattedField as keyof PCROverviewProps,
                      !isTotal ? agencyIds[index] : undefined,
                    ),
                    'decimal',
                    '!text-3xl',
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
      )
    )
  })
}

export default PCROverviewFundingData
